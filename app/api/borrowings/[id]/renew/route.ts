import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize } from '@/lib/permissions';
import { isValidObjectId } from '@/lib/utils';
import { serverError } from '@/lib/http';
import { getLibrarySettings } from '@/lib/settings';
import { notifyUser } from '@/lib/notifications';
import { writeAuditLog } from '@/lib/audit';
import BorrowingRecord from '@/models/BorrowingRecord';
import Reservation from '@/models/Reservation';
import Member from '@/models/Member';

type Context = { params: Promise<{ id: string }> };
export const runtime = 'nodejs';
export async function POST(_request: Request, context: Context) {
  const access = await authorize(['Admin', 'Librarian', 'Member']); if (access.response) return access.response;
  try {
    const { id } = await context.params; if (!isValidObjectId(id)) return NextResponse.json({ error: 'Borrowing record not found.' }, { status: 404 });
    await connectDB(); const settings = await getLibrarySettings();
    const record = await BorrowingRecord.findOne({ _id: id, status: 'Borrowed' }).populate('bookId', 'title').populate('memberId', 'userId fullName');
    if (!record) return NextResponse.json({ error: 'Active borrowing record not found.' }, { status: 404 });
    const member = record.memberId as unknown as { _id: unknown; userId?: unknown; fullName: string };
    const book = record.bookId as unknown as { _id: unknown; title: string };
    if (access.user.role === 'Member' && String(member.userId || '') !== access.user.id) return NextResponse.json({ error: 'You can only renew your own loans.' }, { status: 403 });
    if (record.renewedCount >= settings.maxRenewals) return NextResponse.json({ error: 'This loan has reached its renewal limit.' }, { status: 409 });
    const competingReservation = await Reservation.exists({ bookId: book._id, status: { $in: ['Pending', 'Available for pickup'] }, memberId: { $ne: member._id } });
    if (competingReservation) return NextResponse.json({ error: 'This book has a reservation queue and cannot be renewed.' }, { status: 409 });
    const oldDueAt = record.dueAt; const newDueAt = new Date(Math.max(oldDueAt.getTime(), Date.now())); newDueAt.setDate(newDueAt.getDate() + settings.renewalExtensionDays);
    record.renewedCount += 1; record.dueAt = newDueAt; record.renewalHistory.push({ oldDueAt, newDueAt, renewedBy: access.user.id as never, renewedAt: new Date() });
    await record.save();
    await writeAuditLog({ actor: access.user, action: 'borrowing.renewed', resourceType: 'BorrowingRecord', resourceId: id, before: { dueAt: oldDueAt }, after: { dueAt: newDueAt, renewedCount: record.renewedCount } });
    if (member.userId) await notifyUser({ userId: String(member.userId), type: 'Due date', title: 'Book due date extended', message: `${book.title} is now due on ${newDueAt.toLocaleDateString('en-GB')}.`, targetUrl: '/member/my-books' });
    return NextResponse.json({ success: true, dueAt: newDueAt, renewedCount: record.renewedCount });
  } catch (error) { return serverError('borrowings/renew', error); }
}
