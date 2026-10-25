import Link from 'next/link';
import { Activity, AlarmClock, ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, BookCopy, CalendarClock, CircleDollarSign, Users } from 'lucide-react';
import { connectDB } from '@/lib/mongodb';
import Book from '@/models/Book';
import Member from '@/models/Member';
import BorrowingRecord from '@/models/BorrowingRecord';
import Fine from '@/models/Fine';
import Reservation from '@/models/Reservation';
import Category from '@/models/Category';
import { StatCard } from '@/components/stat-card';
import { SectionHeading } from '@/components/section-heading';
import { DashboardCharts } from '@/components/dashboard-charts';

function keyFor(date: Date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; }
function monthFor(key: string) { const [y,m]=key.split('-').map(Number); return new Date(y,m-1,1).toLocaleDateString('en-US',{month:'short'}); }

export default async function AdminDashboardPage() {
  await connectDB();
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth()-5, 1);
  const [bookTitles, copies, availableCopies, activeLoans, members, activeMembers, overdueLoans, fineSummary, waitingReservations, newBooks, recentLoans, monthlyBorrowed, monthlyReturned, categoryRows] = await Promise.all([
    Book.countDocuments({ archivedAt: null }),
    Book.aggregate([{ $match: { archivedAt: null } }, { $group: { _id: null, total: { $sum: '$totalCopies' } } }]),
    Book.aggregate([{ $match: { archivedAt: null } }, { $group: { _id: null, total: { $sum: '$availableCopies' } } }]),
    BorrowingRecord.countDocuments({ status: 'Borrowed' }),
    Member.countDocuments({}),
    Member.countDocuments({ status: 'Active' }),
    BorrowingRecord.countDocuments({ status: 'Borrowed', dueAt: { $lt: now } }),
    Fine.aggregate([{ $match: { status: { $in: ['Unpaid','Partially Paid'] } } }, { $group: { _id: null, total: { $sum: { $subtract: ['$assessedAmount','$paidAmount'] } } } }]),
    Reservation.countDocuments({ status: { $in: ['Pending','Available for pickup'] } }),
    Book.find({ archivedAt: null }).sort({ createdAt: -1 }).limit(5).select('title createdAt totalCopies availableCopies').lean(),
    BorrowingRecord.find({}).sort({ createdAt: -1 }).limit(6).populate('bookId','title').populate('memberId','fullName memberId').select('status borrowedAt dueAt returnedAt bookId memberId').lean(),
    BorrowingRecord.aggregate([{ $match: { borrowedAt: { $gte: sixMonthsAgo } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$borrowedAt' } }, count: { $sum: 1 } } }]),
    BorrowingRecord.aggregate([{ $match: { returnedAt: { $gte: sixMonthsAgo }, status: 'Returned' } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$returnedAt' } }, count: { $sum: 1 } } }]),
    Book.aggregate([{ $match: { archivedAt: null } }, { $group: { _id: '$categoryId', books: { $sum: 1 } } }, { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } }, { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } }, { $project: { name: { $ifNull: ['$category.name','Uncategorized'] }, books: 1 } }, { $sort: { books: -1 } }, { $limit: 6 }]),
  ]);
  const borrowedMap = new Map<string,number>(monthlyBorrowed.map((row:{_id:string;count:number})=>[row._id,row.count]));
  const returnedMap = new Map<string,number>(monthlyReturned.map((row:{_id:string;count:number})=>[row._id,row.count]));
  const months = Array.from({length:6},(_,index)=>{const date=new Date(now.getFullYear(),now.getMonth()-5+index,1);const key=keyFor(date);return {month:monthFor(key),borrowed:borrowedMap.get(key)||0,returned:returnedMap.get(key)||0};});
  const formats = new Intl.NumberFormat('en-BD',{style:'currency',currency:'BDT',maximumFractionDigits:0});
  const safeRows = recentLoans as unknown as Array<{_id:unknown;status:string;borrowedAt:Date;dueAt:Date;returnedAt?:Date;bookId:{title:string}|null;memberId:{fullName:string;memberId:string}|null}>;
  return <div className="space-y-7">
    <SectionHeading title="Good to see you again" description={`Here is what is happening at your library today, ${now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}.`} icon={BookOpen} action={<Link href="/admin/books/new" className="btn-primary"><BookOpen size={16}/> Add a book</Link>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Book titles" value={bookTitles} note="Active catalog records" icon={BookOpen}/><StatCard label="Physical copies" value={copies[0]?.total||0} note="Across active titles" icon={BookCopy} tone="blue"/><StatCard label="Available copies" value={availableCopies[0]?.total||0} note="Ready to borrow" icon={BookOpen}/><StatCard label="Currently borrowed" value={activeLoans} note="Active borrowing records" icon={ArrowUpRight} tone="amber"/><StatCard label="Registered members" value={members} note={`${activeMembers} currently active`} icon={Users} tone="blue"/><StatCard label="Overdue records" value={overdueLoans} note="Borrowed books past due date" icon={AlarmClock} tone="rose"/><StatCard label="Outstanding fines" value={formats.format(fineSummary[0]?.total||0)} note="Unpaid and partially paid" icon={CircleDollarSign} tone="amber"/><StatCard label="Reservations waiting" value={waitingReservations} note="Pending or ready for pickup" icon={CalendarClock}/></div>
    <DashboardCharts months={months} categories={categoryRows.map((row:{name:string;books:number})=>({name:row.name,books:row.books}))}/>
    <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
      <section className="panel overflow-hidden"><div className="flex items-center justify-between border-b p-5" style={{borderColor:'var(--line)'}}><div><h2 className="font-bold">Recent circulation</h2><p className="mt-1 text-xs muted">The latest issue and return records</p></div><Link href="/admin/borrowings" className="flex items-center gap-1 text-xs font-semibold" style={{color:'var(--primary)'}}>View all <ArrowRight size={14}/></Link></div><div className="overflow-x-auto"><table className="w-full min-w-[520px]"><thead><tr><th className="table-th">Member / book</th><th className="table-th">Activity</th><th className="table-th">Date</th><th className="table-th">Status</th></tr></thead><tbody>{safeRows.length===0?<tr><td colSpan={4} className="table-td py-10 text-center muted">No circulation activity yet.</td></tr>:safeRows.map(row=><tr key={String(row._id)}><td className="table-td"><p className="font-semibold">{row.bookId?.title||'Book record unavailable'}</p><p className="mt-1 text-[11px] muted">{row.memberId?.fullName||'Member'} {row.memberId?.memberId?`· ${row.memberId.memberId}`:''}</p></td><td className="table-td">{row.status==='Returned'?'Returned':'Issued'}</td><td className="table-td">{new Date(row.returnedAt||row.borrowedAt).toLocaleDateString()}</td><td className="table-td"><span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{background:row.status==='Returned'?'rgba(59,130,246,.1)':'rgba(8,132,92,.1)',color:row.status==='Returned'?'#3b82f6':'var(--primary)'}}>{row.status}</span></td></tr>)}</tbody></table></div></section>
      <section className="panel overflow-hidden"><div className="flex items-center justify-between border-b p-5" style={{borderColor:'var(--line)'}}><div><h2 className="font-bold">Recently added books</h2><p className="mt-1 text-xs muted">Newest additions to your collection</p></div><Link href="/admin/books" className="flex items-center gap-1 text-xs font-semibold" style={{color:'var(--primary)'}}>Manage catalog <ArrowRight size={14}/></Link></div><div className="divide-y" style={{borderColor:'var(--line)'}}>{newBooks.length===0?<p className="p-8 text-center text-sm muted">Your catalog is empty. Add your first book to get started.</p>:newBooks.map((book:{_id:unknown;title:string;createdAt:Date;totalCopies:number;availableCopies:number})=><div key={String(book._id)} className="flex items-center gap-3 px-5 py-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{background:'rgba(8,132,92,.1)',color:'var(--primary)'}}><BookOpen size={18}/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{book.title}</p><p className="mt-1 text-[11px] muted">Added {new Date(book.createdAt).toLocaleDateString()}</p></div><div className="text-right"><p className="text-sm font-bold">{book.availableCopies}/{book.totalCopies}</p><p className="text-[10px] muted">available</p></div></div>)}</div></section>
    </div>
    <div className="grid gap-4 sm:grid-cols-3"><Link href="/admin/borrowings" className="panel flex items-center gap-3 p-4 transition hover:-translate-y-0.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{background:'rgba(8,132,92,.1)',color:'var(--primary)'}}><BookCopy size={18}/></span><span className="flex-1"><strong className="block text-sm">Issue a book</strong><small className="mt-1 block muted">Start a new borrowing record</small></span><ArrowRight size={16} className="muted"/></Link><Link href="/admin/returns" className="panel flex items-center gap-3 p-4 transition hover:-translate-y-0.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><ArrowDownRight size={18}/></span><span className="flex-1"><strong className="block text-sm">Process a return</strong><small className="mt-1 block muted">Update inventory and assess fines</small></span><ArrowRight size={16} className="muted"/></Link><Link href="/admin/reports" className="panel flex items-center gap-3 p-4 transition hover:-translate-y-0.5"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Activity size={18}/></span><span className="flex-1"><strong className="block text-sm">Review reports</strong><small className="mt-1 block muted">Export key library records</small></span><ArrowRight size={16} className="muted"/></Link></div>
  </div>;
}
