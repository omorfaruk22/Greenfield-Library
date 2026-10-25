import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BookOpen, CalendarDays, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import { connectDB } from '@/lib/mongodb';
import { isValidObjectId, formatDate } from '@/lib/utils';
import Member from '@/models/Member';
import BorrowingRecord from '@/models/BorrowingRecord';
import Fine from '@/models/Fine';
import Reservation from '@/models/Reservation';
import { SectionHeading } from '@/components/section-heading';

type Context = { params: Promise<{ id: string }> };
type RelatedBook = { title?: string; isbn?: string } | null;
type RelatedStaff = { name?: string } | null;

export default async function MemberDetailsPage({ params }: Context) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();
  await connectDB();
  const member = await Member.findById(id).lean();
  if (!member) notFound();
  const [loans, activeLoans, fines, reservations] = await Promise.all([
    BorrowingRecord.find({ memberId: member._id }).populate('bookId', 'title isbn').populate('processedBy', 'name').sort({ createdAt: -1 }).limit(30).lean(),
    BorrowingRecord.countDocuments({ memberId: member._id, status: 'Borrowed' }),
    Fine.aggregate([{ $match: { memberId: member._id, status: { $in: ['Unpaid', 'Partially Paid'] } } }, { $group: { _id: null, assessed: { $sum: '$assessedAmount' }, paid: { $sum: '$paidAmount' } } }]),
    Reservation.countDocuments({ memberId: member._id, status: { $in: ['Pending', 'Available for pickup'] } }),
  ]);
  const outstanding = Math.max(0, Number(fines[0]?.assessed || 0) - Number(fines[0]?.paid || 0));
  return <div className="space-y-5">
    <Link href="/admin/members" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--primary)' }}><ArrowLeft size={16} /> Back to members</Link>
    <SectionHeading title="Member details" description="Membership status, active loans, fines, reservations, and recent circulation history." icon={UserRound} />
    <section className="panel flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:p-6"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold" style={{ background: 'rgba(8,132,92,.1)', color: 'var(--primary)' }}>{member.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{member.fullName}</h2><span className="rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: member.status === 'Active' ? 'rgba(8,132,92,.1)' : 'rgba(225,29,72,.1)', color: member.status === 'Active' ? 'var(--primary)' : '#e11d48' }}>{member.status}</span></div><p className="mt-1 text-xs muted">{member.memberId} · {member.membershipType}</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><p className="flex items-center gap-2 text-sm"><Mail size={15} className="muted" />{member.email}</p>{member.phone && <p className="flex items-center gap-2 text-sm"><Phone size={15} className="muted" />{member.phone}</p>}{member.address && <p className="flex items-center gap-2 text-sm sm:col-span-2"><MapPin size={15} className="muted" />{member.address}</p>}<p className="flex items-center gap-2 text-xs muted"><CalendarDays size={15} />Registered {formatDate(member.registrationDate)}</p><p className="flex items-center gap-2 text-xs muted"><CalendarDays size={15} />Expires {formatDate(member.expiryDate)}</p></div></div><Link className="btn-secondary !py-2 text-xs" href="/admin/members">Edit in directory</Link></section>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="panel p-4"><p className="text-xs muted">Active loans</p><p className="mt-2 text-2xl font-bold">{activeLoans}</p><p className="mt-1 text-[11px] muted">Limit: {member.borrowingLimit}</p></div><div className="panel p-4"><p className="text-xs muted">Outstanding fines</p><p className="mt-2 text-2xl font-bold">৳ {outstanding.toLocaleString()}</p><p className="mt-1 text-[11px] muted">Unpaid / partially paid</p></div><div className="panel p-4"><p className="text-xs muted">Active reservations</p><p className="mt-2 text-2xl font-bold">{reservations}</p><p className="mt-1 text-[11px] muted">Pending or pickup-ready</p></div><div className="panel p-4"><p className="text-xs muted">Member since</p><p className="mt-2 text-lg font-bold">{formatDate(member.registrationDate)}</p><p className="mt-1 text-[11px] muted">Registration date</p></div></div>
    <section className="panel overflow-hidden"><div className="flex items-center gap-2 border-b p-5" style={{ borderColor: 'var(--line)' }}><BookOpen size={18} style={{ color: 'var(--primary)' }} /><div><h2 className="font-bold">Borrowing history</h2><p className="mt-1 text-xs muted">Most recent 30 records</p></div></div><div className="overflow-x-auto"><table className="w-full min-w-[720px]"><thead><tr>{['Book','Borrowed','Due date','Returned','Status','Processed by'].map((label) => <th className="table-th" key={label}>{label}</th>)}</tr></thead><tbody>{loans.length ? loans.map((loan) => { const book = loan.bookId as unknown as RelatedBook; const staff = loan.processedBy as unknown as RelatedStaff; return <tr key={String(loan._id)}><td className="table-td"><p className="font-semibold">{book?.title || 'Book unavailable'}</p><p className="mt-1 text-[10px] muted">{book?.isbn || 'No ISBN'}</p></td><td className="table-td">{formatDate(loan.borrowedAt)}</td><td className="table-td">{formatDate(loan.dueAt)}</td><td className="table-td">{formatDate(loan.returnedAt)}</td><td className="table-td">{loan.status}</td><td className="table-td">{staff?.name || '—'}</td></tr>; }) : <tr><td className="table-td py-10 text-center muted" colSpan={6}>No borrowing history yet.</td></tr>}</tbody></table></div></section>
  </div>;
}
