import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize, STAFF_ROLES } from '@/lib/permissions';
import { serverError } from '@/lib/http';
import Book from '@/models/Book';
import Member from '@/models/Member';
import BorrowingRecord from '@/models/BorrowingRecord';
import Fine from '@/models/Fine';
import FinePayment from '@/models/FinePayment';
import Reservation from '@/models/Reservation';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const access = await authorize(STAFF_ROLES);
  if (access.response) return access.response;

  try {
    await connectDB();
    const url = new URL(request.url);
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    const startDate = start ? new Date(start) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = end ? new Date(end) : new Date();
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) {
      return NextResponse.json({ error: 'Invalid reporting date range.' }, { status: 422 });
    }

    const createdAtRange = { $gte: startDate, $lte: endDate };
    const [
      bookTitles, copyTotals, activeLoans, overdue, memberCount, activeMembers,
      returnedInRange, fineTotals, paymentTotals, reservationsWaiting,
      categoryInventory, popularBooks, monthly,
    ] = await Promise.all([
      Book.countDocuments({ archivedAt: null }),
      Book.aggregate([
        { $match: { archivedAt: null } },
        { $group: { _id: null, total: { $sum: '$totalCopies' }, available: { $sum: '$availableCopies' } } },
      ]),
      BorrowingRecord.countDocuments({ status: 'Borrowed' }),
      BorrowingRecord.countDocuments({ status: 'Borrowed', dueAt: { $lt: new Date() } }),
      Member.countDocuments({}),
      Member.countDocuments({ status: 'Active' }),
      BorrowingRecord.countDocuments({ status: 'Returned', returnedAt: { $gte: startDate, $lte: endDate } }),
      Fine.aggregate([
        { $match: { createdAt: createdAtRange } },
        { $group: { _id: null, assessed: { $sum: '$assessedAmount' }, paid: { $sum: '$paidAmount' }, outstanding: { $sum: { $subtract: ['$assessedAmount', '$paidAmount'] } } } },
      ]),
      FinePayment.aggregate([
        { $match: { paidAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Reservation.countDocuments({ status: { $in: ['Pending', 'Available for pickup'] } }),
      Book.aggregate([
        { $match: { archivedAt: null } },
        { $group: { _id: '$categoryId', titles: { $sum: 1 }, copies: { $sum: '$totalCopies' }, available: { $sum: '$availableCopies' } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        { $project: { name: { $ifNull: ['$category.name', 'Uncategorized'] }, titles: 1, copies: 1, available: 1 } },
        { $sort: { titles: -1 } },
      ]),
      BorrowingRecord.aggregate([
        { $group: { _id: '$bookId', borrows: { $sum: 1 } } },
        { $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' } },
        { $unwind: '$book' },
        { $project: { title: '$book.title', borrows: 1 } },
        { $sort: { borrows: -1 } },
        { $limit: 10 },
      ]),
      BorrowingRecord.aggregate([
        { $match: { borrowedAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$borrowedAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const reportType = url.searchParams.get('type') || 'overview';
    if (url.searchParams.get('format') === 'csv') {
      let header: string[];
      let rows: string[][];
      if (reportType === 'books') {
        header = ['Title', 'ISBN', 'Total copies', 'Available copies', 'Shelf'];
        const data = await Book.find({ archivedAt: null }).select('title isbn totalCopies availableCopies shelfLocation').lean();
        rows = data.map((item) => [item.title, item.isbn || '', String(item.totalCopies), String(item.availableCopies), item.shelfLocation || '']);
      } else if (reportType === 'members') {
        header = ['Member ID', 'Name', 'Email', 'Type', 'Status'];
        const data = await Member.find({}).select('memberId fullName email membershipType status').lean();
        rows = data.map((item) => [item.memberId, item.fullName, item.email, item.membershipType, item.status]);
      } else {
        header = ['Borrowing ID', 'Member', 'Book', 'Borrowed at', 'Due at', 'Returned at', 'Status'];
        const data = await BorrowingRecord.find({ createdAt: createdAtRange }).populate('memberId', 'fullName memberId').populate('bookId', 'title').lean();
        rows = data.map((item) => {
          const member = item.memberId as unknown as { fullName?: string; memberId?: string } | null;
          const book = item.bookId as unknown as { title?: string } | null;
          return [String(item._id), member?.fullName || member?.memberId || '', book?.title || '', new Date(item.borrowedAt).toISOString(), new Date(item.dueAt).toISOString(), item.returnedAt ? new Date(item.returnedAt).toISOString() : '', item.status];
        });
      }
      const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\r\n');
      return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="library-${reportType}-report.csv"` } });
    }

    return NextResponse.json({
      range: { start: startDate, end: endDate },
      overview: {
        bookTitles,
        totalCopies: copyTotals[0]?.total || 0,
        availableCopies: copyTotals[0]?.available || 0,
        borrowedCopies: Math.max(0, (copyTotals[0]?.total || 0) - (copyTotals[0]?.available || 0)),
        activeLoans,
        overdue,
        memberCount,
        activeMembers,
        returnedInRange,
        assessedFines: fineTotals[0]?.assessed || 0,
        paidFines: fineTotals[0]?.paid || 0,
        outstandingFines: fineTotals[0]?.outstanding || 0,
        paymentsCollected: paymentTotals[0]?.total || 0,
        paymentCount: paymentTotals[0]?.count || 0,
        reservationsWaiting,
      },
      categoryInventory,
      popularBooks,
      monthly,
    });
  } catch (error) {
    return serverError('reports/read', error);
  }
}
