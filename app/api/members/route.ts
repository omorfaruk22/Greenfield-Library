import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize, STAFF_ROLES } from '@/lib/permissions';
import { memberSchema } from '@/lib/validators/member';
import { getPagination } from '@/lib/utils';
import { isDuplicateKey, readJson, serverError, validationError } from '@/lib/http';
import { writeAuditLog } from '@/lib/audit';
import Member from '@/models/Member';
import BorrowingRecord from '@/models/BorrowingRecord';

export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  const access = await authorize(STAFF_ROLES); if (access.response) return access.response;
  try {
    await connectDB(); const url = new URL(request.url); const { page, pageSize, skip } = getPagination(url);
    const q = (url.searchParams.get('q') || '').trim().slice(0, 120);
    const status = url.searchParams.get('status');
    const filter: Record<string, unknown> = {};
    if (q) { const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); filter.$or = [{ fullName: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }, { memberId: { $regex: escaped, $options: 'i' } }]; }
    if (status && ['Active', 'Suspended', 'Expired'].includes(status)) filter.status = status;
    const [items, total] = await Promise.all([Member.find(filter).select('-__v').sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(), Member.countDocuments(filter)]);
    return NextResponse.json({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) { return serverError('members/list', error); }
}
export async function POST(request: Request) {
  const access = await authorize(STAFF_ROLES); if (access.response) return access.response;
  try {
    const body = await readJson(request); const parsed = memberSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error)!;
    await connectDB();
    if (await Member.exists({ email: parsed.data.email })) return NextResponse.json({ error: 'A member with this email already exists.' }, { status: 409 });
    const memberId = `MEM-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const member = await Member.create({ ...parsed.data, memberId, expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : undefined });
    await writeAuditLog({ actor: access.user, action: 'member.created', resourceType: 'Member', resourceId: member._id.toString(), after: { memberId, fullName: member.fullName, email: member.email } });
    return NextResponse.json({ item: member }, { status: 201 });
  } catch (error) {
    const validation = validationError(error); if (validation) return validation;
    if (isDuplicateKey(error)) return NextResponse.json({ error: 'A member with this email or ID already exists.' }, { status: 409 });
    return serverError('members/create', error);
  }
}
