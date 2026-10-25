import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize, STAFF_ROLES } from '@/lib/permissions';
import { issueSchema } from '@/lib/validators/operations';
import { getPagination } from '@/lib/utils';
import { readJson, serverError, validationError } from '@/lib/http';
import { getLibrarySettings } from '@/lib/settings';
import { withMongoTransaction } from '@/lib/transaction';
import { notifyUser } from '@/lib/notifications';
import { writeAuditLog } from '@/lib/audit';
import Member from '@/models/Member';
import Book from '@/models/Book';
import BorrowingRecord from '@/models/BorrowingRecord';
import Fine from '@/models/Fine';
import Reservation from '@/models/Reservation';
import { getMemberForUser } from '@/lib/member-for-user';
import type { ClientSession } from 'mongoose';

export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  const access = await authorize(['Admin', 'Librarian', 'Member']); if (access.response) return access.response;
  try {
    await connectDB(); const url = new URL(request.url); const { page, pageSize, skip } = getPagination(url);
    const status = url.searchParams.get('status'); const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
    const filter: Record<string, unknown> = {};
    if (status === 'active') filter.status = 'Borrowed';
    if (status === 'returned') filter.status = 'Returned';
    if (url.searchParams.get('overdue') === 'true' && access.user.role !== 'Member') filter.dueAt = { $lt: new Date() };
    if (access.user.role === 'Member') {
      const member = await getMemberForUser(access.user);
      if (!member) return NextResponse.json({ items: [], page, pageSize, total: 0, totalPages: 0 });
      filter.memberId = member._id;
    }
    const [records, total] = await Promise.all([
      BorrowingRecord.find(filter).populate({ path: 'memberId', select: 'memberId fullName email userId' }).populate({ path: 'bookId', select: 'title isbn coverImageUrl' }).populate({ path: 'processedBy', select: 'name' }).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      BorrowingRecord.countDocuments(filter),
    ]);
    const filtered = q ? records.filter((record) => {
      const member = record.memberId as unknown as { fullName?: string; memberId?: string } | null;
      const book = record.bookId as unknown as { title?: string; isbn?: string } | null;
      const needle = q.toLowerCase();
      return [member?.fullName, member?.memberId, book?.title, book?.isbn].some((value) => String(value || '').toLowerCase().includes(needle));
    }) : records;
    return NextResponse.json({ items: filtered, page, pageSize, total: q ? filtered.length : total, totalPages: Math.ceil((q ? filtered.length : total) / pageSize) });
  } catch (error) { return serverError('borrowings/list', error); }
}

export async function POST(request: Request) {
  const access = await authorize(STAFF_ROLES); if (access.response) return access.response;
  try {
    const body = await readJson(request); const parsed = issueSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error)!;
    await connectDB();
    const settings = await getLibrarySettings();
    const loanDays = parsed.data.loanDays ?? settings.defaultLoanDays;
    const result = await withMongoTransaction(async (session: ClientSession) => {
      const member = await Member.findById(parsed.data.memberId).session(session);
      if (!member) throw new Error('MEMBER_NOT_FOUND');
      if (member.status !== 'Active' || (member.expiryDate && member.expiryDate < new Date())) throw new Error('MEMBER_INACTIVE');
      const book = await Book.findOne({ _id: parsed.data.bookId, archivedAt: null }).session(session);
      if (!book) throw new Error('BOOK_NOT_FOUND');
      const currentLoans = await BorrowingRecord.countDocuments({ memberId: member._id, status: 'Borrowed' }).session(session);
      if (currentLoans >= member.borrowingLimit) throw new Error('BORROW_LIMIT_REACHED');
      if (settings.blockBorrowingWithUnpaidFines) {
        const outstanding = await Fine.aggregate([{ $match: { memberId: member._id, status: { $in: ['Unpaid', 'Partially Paid'] } } }, { $group: { _id: null, total: { $sum: { $subtract: ['$assessedAmount', '$paidAmount'] } } } }]).session(session);
        if ((outstanding[0]?.total || 0) > 0) throw new Error('UNPAID_FINE_BLOCK');
      }
      const held = await Reservation.findOne({ bookId: book._id, status: 'Available for pickup' }).sort({ reservedAt: 1 }).session(session);
      if (held && String(held.memberId) !== String(member._id)) throw new Error('BOOK_HELD_FOR_ANOTHER_MEMBER');
      const updatedBook = await Book.findOneAndUpdate({ _id: book._id, archivedAt: null, availableCopies: { $gt: 0 } }, { $inc: { availableCopies: -1, borrowingCount: 1 } }, { new: true, session });
      if (!updatedBook) throw new Error('NO_COPIES_AVAILABLE');
      const dueAt = new Date(); dueAt.setDate(dueAt.getDate() + loanDays);
      const [record] = await BorrowingRecord.create([{ memberId: member._id, bookId: book._id, borrowedAt: new Date(), dueAt, status: 'Borrowed', processedBy: access.user.id }], { session });
      if (held && String(held.memberId) === String(member._id)) { held.status = 'Fulfilled'; held.fulfilledAt = new Date(); await held.save({ session }); }
      return { recordId: record._id.toString(), memberName: member.fullName, memberUserId: member.userId?.toString() || '', bookTitle: book.title, dueAt };
    });
    await writeAuditLog({ actor: access.user, action: 'borrowing.issued', resourceType: 'BorrowingRecord', resourceId: result.recordId, after: { memberName: result.memberName, bookTitle: result.bookTitle, dueAt: result.dueAt } });
    if (result.memberUserId) await notifyUser({ userId: result.memberUserId, type: 'Borrowing', title: 'Book issued successfully', message: `${result.bookTitle} is due on ${result.dueAt.toLocaleDateString('en-GB')}.`, targetUrl: '/member/my-books' });
    return NextResponse.json({ success: true, recordId: result.recordId, dueAt: result.dueAt }, { status: 201 });
  } catch (error) {
    const validation = validationError(error); if (validation) return validation;
    const errors: Record<string, [string, number]> = {
      MEMBER_NOT_FOUND: ['Member not found.', 404], MEMBER_INACTIVE: ['This member is inactive or membership has expired.', 409],
      BOOK_NOT_FOUND: ['Book not found or archived.', 404], BORROW_LIMIT_REACHED: ['This member has reached their borrowing limit.', 409],
      UNPAID_FINE_BLOCK: ['Outstanding fines must be settled before borrowing.', 409], BOOK_HELD_FOR_ANOTHER_MEMBER: ['This copy is reserved for another member.', 409], NO_COPIES_AVAILABLE: ['No copies are currently available.', 409],
    };
    if (error instanceof Error && errors[error.message]) return NextResponse.json({ error: errors[error.message][0] }, { status: errors[error.message][1] });
    if (error instanceof Error && error.message.includes('requires a MongoDB Atlas cluster')) return NextResponse.json({ error: error.message }, { status: 503 });
    return serverError('borrowings/issue', error);
  }
}
