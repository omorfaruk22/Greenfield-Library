'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, BookOpen, CalendarPlus, CheckCircle2, Clock3, MapPin, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api-client';

type BookDetails = {
  id: string;
  title: string;
  subtitle: string;
  isbn: string;
  language: string;
  edition: string;
  publicationYear?: number;
  description: string;
  coverImageUrl: string;
  shelfLocation: string;
  totalCopies: number;
  availableCopies: number;
  authors: { id: string; name: string; biography: string }[];
  category: { id: string; name: string; slug: string } | null;
  publisher: { id: string; name: string } | null;
};

export function MemberBookDetail({ book }: { book: BookDetails }) {
  const [reserving, setReserving] = useState(false);
  async function reserve() {
    setReserving(true);
    try {
      await apiRequest('/api/reservations', { method: 'POST', body: JSON.stringify({ bookId: book.id }) });
      toast.success(`Reservation placed for ${book.title}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Reservation failed.');
    } finally {
      setReserving(false);
    }
  }

  return <div className="mx-auto max-w-5xl space-y-5">
    <Link href="/member/catalog" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--primary)' }}><ArrowLeft size={16} /> Back to catalog</Link>
    <section className="panel grid gap-7 p-5 sm:p-8 md:grid-cols-[240px_minmax(0,1fr)]">
      <div className="flex min-h-[280px] items-center justify-center overflow-hidden rounded-2xl p-4" style={{ background: 'rgba(8,132,92,.08)' }}>
        {book.coverImageUrl ? <img src={book.coverImageUrl} alt={`Cover of ${book.title}`} className="max-h-[330px] w-full rounded-xl object-contain" /> : <BookOpen size={78} strokeWidth={1.2} style={{ color: 'var(--primary)' }} />}
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="flex flex-wrap gap-2">{book.category && <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: 'rgba(8,132,92,.1)', color: 'var(--primary)' }}>{book.category.name}</span>}<span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: book.availableCopies > 0 ? 'rgba(8,132,92,.1)' : 'rgba(217,119,6,.12)', color: book.availableCopies > 0 ? 'var(--primary)' : '#b45309' }}>{book.availableCopies > 0 ? 'Available now' : 'Currently unavailable'}</span></div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{book.title}</h1>
        {book.subtitle && <p className="mt-2 text-base muted">{book.subtitle}</p>}
        <p className="mt-4 text-sm leading-7 muted">{book.description || 'No description has been added for this title yet.'}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--line)' }}><div className="flex items-center gap-2 text-xs muted"><BookOpen size={15} /> Author(s)</div><p className="mt-2 text-sm font-semibold">{book.authors.length ? book.authors.map((author) => author.name).join(', ') : 'Not listed'}</p></div>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--line)' }}><div className="flex items-center gap-2 text-xs muted"><Tag size={15} /> ISBN</div><p className="mt-2 text-sm font-semibold">{book.isbn || 'Not provided'}</p></div>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--line)' }}><div className="flex items-center gap-2 text-xs muted"><Clock3 size={15} /> Publication</div><p className="mt-2 text-sm font-semibold">{book.publicationYear || 'Year unavailable'}{book.edition ? ` · ${book.edition}` : ''} · {book.language || 'English'}</p></div>
          <div className="rounded-xl border p-4" style={{ borderColor: 'var(--line)' }}><div className="flex items-center gap-2 text-xs muted"><MapPin size={15} /> Shelf location</div><p className="mt-2 text-sm font-semibold">{book.shelfLocation || 'Ask the library desk'}</p></div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-5" style={{ borderColor: 'var(--line)' }}><div><p className="text-xs muted">Physical copies</p><p className="mt-1 text-sm font-semibold">{book.availableCopies} available of {book.totalCopies} total</p>{book.publisher && <p className="mt-1 text-xs muted">Publisher: {book.publisher.name}</p>}</div><button className="btn-primary" disabled={reserving} onClick={() => void reserve()}><CalendarPlus size={16} />{reserving ? 'Placing reservation…' : 'Reserve this book'}</button></div>
      </div>
    </section>
    <p className="flex items-center gap-2 text-xs muted"><CheckCircle2 size={15} /> Reservations are subject to library eligibility rules and current queue status.</p>
  </div>;
}
