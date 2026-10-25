import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { ClientSession } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { authorize } from '@/lib/permissions';
import { readJson, serverError, validationError } from '@/lib/http';
import { isValidObjectId } from '@/lib/utils';
import { withMongoTransaction } from '@/lib/transaction';
import { writeAuditLog } from '@/lib/audit';
import { notifyUser } from '@/lib/notifications';
import Fine from '@/models/Fine';
import Member from '@/models/Member';

type Context = { params: Promise<{ id: string }> };
const waiverSchema = z.object({ notes: z.string().trim().min(5, 'Explain why this fine is being waived.').max(1500) });

export const runtime = 'nodejs';

export async function PATCH(request: Request, context: Context) {
  const access = await authorize(['Admin']);
  if (access.response) return access.response;
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Fine record not found.' }, { status: 404 });
    const parsed = waiverSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error)!;
    await connectDB();
    const result = await withMongoTransaction(async (session: ClientSession) => {
      const fine = await Fine.findOne({ _id: id, status: { $in: ['Unpaid', 'Partially Paid'] } }).session(session);
      if (!fine) throw new Error('FINE_NOT_WAIVABLE');
      const before = { status: fine.status, assessedAmount: fine.assessedAmount, paidAmount: fine.paidAmount, notes: fine.notes };
      fine.status = 'Waived';
      fine.notes = `${fine.notes ? `${fine.notes}\n` : ''}Waived by ${access.user.name}: ${parsed.data.notes}`;
      await fine.save({ session });
      const member = await Member.findById(fine.memberId).session(session);
      return { fineId: fine._id.toString(), memberUserId: member?.userId?.toString() || '', before, after: { status: fine.status, assessedAmount: fine.assessedAmount, paidAmount: fine.paidAmount, notes: fine.notes } };
    });
    await writeAuditLog({ actor: access.user, action: 'fine.waived', resourceType: 'Fine', resourceId: result.fineId, before: result.before, after: result.after });
    if (result.memberUserId) await notifyUser({ userId: result.memberUserId, type: 'Fine', title: 'Fine balance waived', message: 'The library administrator has waived the outstanding balance on a fine.', targetUrl: '/member/my-fines' });
    return NextResponse.json({ success: true, status: 'Waived' });
  } catch (error) {
    const validation = validationError(error);
    if (validation) return validation;
    if (error instanceof Error && error.message === 'FINE_NOT_WAIVABLE') return NextResponse.json({ error: 'Only unpaid or partially paid fines can be waived.' }, { status: 409 });
    if (error instanceof Error && error.message.includes('requires a MongoDB Atlas cluster')) return NextResponse.json({ error: error.message }, { status: 503 });
    return serverError('fines/waive', error);
  }
}
