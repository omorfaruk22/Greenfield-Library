import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize, STAFF_ROLES } from '@/lib/permissions';
import { memberSchema } from '@/lib/validators/member';
import { isValidObjectId } from '@/lib/utils';
import { isDuplicateKey, readJson, serverError, validationError } from '@/lib/http';
import { writeAuditLog } from '@/lib/audit';
import Member from '@/models/Member';
import User from '@/models/User';
import BorrowingRecord from '@/models/BorrowingRecord';

type Context = { params: Promise<{ id: string }> };
export const runtime = 'nodejs';
export async function GET(_request: Request, context: Context) {
  const access = await authorize(STAFF_ROLES); if (access.response) return access.response;
  try {
    const { id } = await context.params; if (!isValidObjectId(id)) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    await connectDB(); const item = await Member.findById(id).lean();
    if (!item) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    const [activeLoans, history] = await Promise.all([
      BorrowingRecord.countDocuments({ memberId: id, status: 'Borrowed' }),
      BorrowingRecord.find({ memberId: id }).populate('bookId', 'title isbn').sort({ createdAt: -1 }).limit(20).lean(),
    ]);
    return NextResponse.json({ item, activeLoans, history });
  } catch (error) { return serverError('members/detail', error); }
}
export async function PATCH(request: Request, context: Context) {
  const access = await authorize(STAFF_ROLES); if (access.response) return access.response;
  try {
    const { id } = await context.params; if (!isValidObjectId(id)) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    const body = await readJson(request); const parsed = memberSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error)!;
    await connectDB(); const item = await Member.findById(id);
    if (!item) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    if (parsed.data.email !== item.email && await Member.exists({ email: parsed.data.email, _id: { $ne: id } })) return NextResponse.json({ error: 'A member with this email already exists.' }, { status: 409 });
    const before = { fullName: item.fullName, email: item.email, status: item.status, borrowingLimit: item.borrowingLimit };
    Object.assign(item, parsed.data, { expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : undefined });
    await item.save();
    if (item.userId) await User.findByIdAndUpdate(item.userId, { name: item.fullName, email: item.email, status: item.status === 'Active' ? 'Active' : 'Suspended' });
    await writeAuditLog({ actor: access.user, action: 'member.updated', resourceType: 'Member', resourceId: id, before, after: { fullName: item.fullName, email: item.email, status: item.status, borrowingLimit: item.borrowingLimit } });
    return NextResponse.json({ item });
  } catch (error) {
    const validation = validationError(error); if (validation) return validation;
    if (isDuplicateKey(error)) return NextResponse.json({ error: 'A member with this email already exists.' }, { status: 409 });
    return serverError('members/update', error);
  }
}
export async function DELETE(_request: Request, context: Context) {
  const access = await authorize(['Admin']); if (access.response) return access.response;
  try {
    const { id } = await context.params; if (!isValidObjectId(id)) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    await connectDB(); const item = await Member.findById(id);
    if (!item) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    const active = await BorrowingRecord.countDocuments({ memberId: id, status: 'Borrowed' });
    if (active) return NextResponse.json({ error: 'This member has active loans. Return those books before suspending the member.' }, { status: 409 });
    item.status = 'Suspended'; await item.save();
    if (item.userId) await User.findByIdAndUpdate(item.userId, { status: 'Suspended' });
    await writeAuditLog({ actor: access.user, action: 'member.suspended', resourceType: 'Member', resourceId: id });
    return NextResponse.json({ success: true });
  } catch (error) { return serverError('members/suspend', error); }
}
