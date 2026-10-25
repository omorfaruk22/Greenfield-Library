import { NextResponse } from 'next/server';
import mongoose, { type ClientSession } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { authorize, STAFF_ROLES } from '@/lib/permissions';
import { objectIdSchema } from '@/lib/validators/common';
import { readJson, serverError, validationError } from '@/lib/http';
import { getLibrarySettings } from '@/lib/settings';
import { calculateOverdueDays } from '@/lib/utils';
import { withMongoTransaction } from '@/lib/transaction';
import { notifyUser } from '@/lib/notifications';
import { writeAuditLog } from '@/lib/audit';
import BorrowingRecord from '@/models/BorrowingRecord';
import Member from '@/models/Member';
import Book from '@/models/Book';
import Fine from '@/models/Fine';
import Reservation from '@/models/Reservation';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  const access = await authorize(STAFF_ROLES); if (access.response) return access.response;
  try {
    const body = await readJson(request) as { borrowingId?: unknown };
    const parsed = objectIdSchema.safeParse(body?.borrowingId);
    if (!parsed.success) return validationError(parsed.error)!;
    await connectDB(); const settings = await getLibrarySettings(); const now = new Date();
    const result = await withMongoTransaction(async (session: ClientSession) => {
      const record = await BorrowingRecord.findOne({ _id: parsed.data, status: 'Borrowed' }).session(session);
      if (!record) throw new Error('ACTIVE_RECORD_NOT_FOUND');
      const member = await Member.findById(record.memberId).session(session);
      const book = await Book.findById(record.bookId).session(session);
      if (!member || !book) throw new Error('RELATED_RECORD_MISSING');
      const changed = await BorrowingRecord.updateOne({ _id: record._id, status: 'Borrowed' }, { $set: { status: 'Returned', returnedAt: now } }, { session });
      if (changed.modifiedCount !== 1) throw new Error('ALREADY_RETURNED');
      const inventory = await Book.updateOne({ _id: book._id, $expr: { $lt: ['$availableCopies', '$totalCopies'] } }, { $inc: { availableCopies: 1 } }, { session });
      if (inventory.modifiedCount !== 1) throw new Error('INVENTORY_INCONSISTENT');
      const overdueDays = calculateOverdueDays(record.dueAt, now, settings.graceDays, settings.timezone);
      const fineAmount = Math.min(settings.maximumFine > 0 ? settings.maximumFine : Number.MAX_SAFE_INTEGER, overdueDays * settings.dailyFineRate);
      let fineId = '';
      if (fineAmount > 0) {
        const [fine] = await Fine.create([{ memberId: member._id, borrowingRecordId: record._id, type: 'Overdue', assessedAmount: fineAmount, paidAmount: 0, status: 'Unpaid', assessedAt: now, assessedDailyRate: settings.dailyFineRate, notes: `${overdueDays} overdue day(s). Rate at return: ${settings.dailyFineRate} per day.` }], { session });
        fineId = fine._id.toString();
      }
      const pending = await Reservation.findOne({ bookId: book._id, status: 'Pending' }).sort({ reservedAt: 1 }).session(session);
      let reservationUserId = '';
      if (pending) {
        pending.status = 'Available for pickup'; pending.availableAt = now;
        pending.pickupExpiresAt = new Date(now.getTime() + settings.pickupDays * 86400000);
        await pending.save({ session });
        const reservationMember = await Member.findById(pending.memberId).session(session);
        reservationUserId = reservationMember?.userId?.toString() || '';
      }
      return { recordId: record._id.toString(), bookTitle: book.title, memberName: member.fullName, memberUserId: member.userId?.toString() || '', dueAt: record.dueAt, overdueDays, fineAmount, fineId, reservationUserId, pickupExpiresAt: pending?.pickupExpiresAt || null };
    });
    await writeAuditLog({ actor: access.user, action: 'borrowing.returned', resourceType: 'BorrowingRecord', resourceId: result.recordId, after: { bookTitle: result.bookTitle, overdueDays: result.overdueDays, fineAmount: result.fineAmount } });
    if (result.memberUserId) await notifyUser({ userId: result.memberUserId, type: 'Return', title: 'Book returned', message: `${result.bookTitle} was checked in. ${result.fineAmount > 0 ? `An overdue fine of ${result.fineAmount} was assessed.` : 'No overdue fine was due.'}`, targetUrl: '/member/my-books' });
    if (result.reservationUserId) await notifyUser({ userId: result.reservationUserId, type: 'Reservation', title: 'Reserved book available', message: `${result.bookTitle} is ready for pickup until ${result.pickupExpiresAt?.toLocaleDateString('en-GB')}.`, targetUrl: '/member/my-reservations' });
    return NextResponse.json({ success: true, recordId: result.recordId, overdueDays: result.overdueDays, fineAmount: result.fineAmount, fineId: result.fineId || null });
  } catch (error) {
    const validation = validationError(error); if (validation) return validation;
    const mapping: Record<string, [string, number]> = { ACTIVE_RECORD_NOT_FOUND: ['Active borrowing record not found or this book was already returned.', 409], ALREADY_RETURNED: ['This book has already been returned.', 409], RELATED_RECORD_MISSING: ['The member or book record is missing.', 409], INVENTORY_INCONSISTENT: ['Inventory is inconsistent. No return was completed; ask an administrator to review the record.', 409] };
    if (error instanceof Error && mapping[error.message]) return NextResponse.json({ error: mapping[error.message][0] }, { status: mapping[error.message][1] });
    if (error instanceof Error && error.message.includes('requires a MongoDB Atlas cluster')) return NextResponse.json({ error: error.message }, { status: 503 });
    return serverError('returns/create', error);
  }
}
