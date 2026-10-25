'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, LoaderCircle, Search, Tags, UserRound, Users } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/api-client';

type Results = {
  query: string;
  books: { _id: string; title: string; isbn?: string; coverImageUrl?: string; availableCopies: number; totalCopies: number }[];
  members: { _id: string; memberId: string; fullName: string; email: string; status: string }[];
  authors: { _id: string; name: string; nationality?: string }[];
  categories: { _id: string; name: string; slug: string; status: string }[];
};

export function GlobalSearchResults({ query, memberView = false }: { query: string; memberView?: boolean }) {
  const [data, setData] = useState<Results | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    apiRequest<Results>(`/api/search?q=${encodeURIComponent(query)}`)
      .then((result) => { if (active) setData(result); })
      .catch((error) => { if (active) toast.error(error instanceof Error ? error.message : 'Search failed.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query]);

  if (loading) return <div className="panel flex items-center justify-center gap-2 py-16 muted"><LoaderCircle size={18} className="animate-spin" /> Searching library records…</div>;
  if (!query.trim()) return <div className="panel py-16 text-center"><Search size={30} className="mx-auto muted"/><p className="mt-3 font-semibold">Enter a search term</p><p className="mt-1 text-xs muted">Use at least two characters to search the library.</p></div>;

  return <div className="space-y-5">
    <div><p className="text-sm muted">Showing results for</p><h2 className="mt-1 text-xl font-bold">“{query}”</h2></div>
    {data?.books.length ? <section className="panel overflow-hidden"><div className="flex items-center gap-2 border-b p-4 font-bold" style={{ borderColor: 'var(--line)' }}><BookOpen size={17} style={{ color: 'var(--primary)' }} /> Books <span className="text-xs muted">({data.books.length})</span></div><div className="divide-y" style={{ borderColor: 'var(--line)' }}>{data.books.map((book) => <Link key={book._id} href={memberView ? `/member/books/${book._id}` : '/admin/books'} className="flex items-center gap-3 p-4 transition hover:bg-black/[.025] dark:hover:bg-white/[.025]"><div className="flex h-12 w-10 items-center justify-center overflow-hidden rounded-lg" style={{ background: 'rgba(8,132,92,.1)', color: 'var(--primary)' }}>{book.coverImageUrl ? <img src={book.coverImageUrl} alt="" className="h-full w-full object-cover" /> : <BookOpen size={19} />}</div><div className="min-w-0 flex-1"><p className="font-semibold">{book.title}</p><p className="mt-1 text-xs muted">ISBN {book.isbn || 'not supplied'} · {book.availableCopies} of {book.totalCopies} available</p></div></Link>)}</div></section> : null}
    {!memberView && data?.members.length ? <section className="panel overflow-hidden"><div className="flex items-center gap-2 border-b p-4 font-bold" style={{ borderColor: 'var(--line)' }}><Users size={17} style={{ color: 'var(--primary)' }} /> Members <span className="text-xs muted">({data.members.length})</span></div><div className="divide-y" style={{ borderColor: 'var(--line)' }}>{data.members.map((member) => <Link key={member._id} href={`/admin/members/${member._id}`} className="flex items-center gap-3 p-4 transition hover:bg-black/[.025] dark:hover:bg-white/[.025]"><div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'var(--page)', color: 'var(--primary)' }}><UserRound size={17} /></div><div className="min-w-0 flex-1"><p className="font-semibold">{member.fullName}</p><p className="mt-1 text-xs muted">{member.memberId} · {member.email}</p></div><span className="text-xs muted">{member.status}</span></Link>)}</div></section> : null}
    {!memberView && data?.authors.length ? <section className="panel overflow-hidden"><div className="flex items-center gap-2 border-b p-4 font-bold" style={{ borderColor: 'var(--line)' }}><UserRound size={17} style={{ color: 'var(--primary)' }} /> Authors <span className="text-xs muted">({data.authors.length})</span></div><div className="grid gap-2 p-4 sm:grid-cols-2">{data.authors.map((author) => <div key={author._id} className="rounded-xl border p-3" style={{ borderColor: 'var(--line)' }}><p className="font-semibold">{author.name}</p><p className="mt-1 text-xs muted">{author.nationality || 'Nationality not listed'}</p></div>)}</div></section> : null}
    {!memberView && data?.categories.length ? <section className="panel overflow-hidden"><div className="flex items-center gap-2 border-b p-4 font-bold" style={{ borderColor: 'var(--line)' }}><Tags size={17} style={{ color: 'var(--primary)' }} /> Categories <span className="text-xs muted">({data.categories.length})</span></div><div className="flex flex-wrap gap-2 p-4">{data.categories.map((category) => <span key={category._id} className="rounded-full px-3 py-2 text-xs font-semibold" style={{ background: 'var(--page)' }}>{category.name} · {category.status}</span>)}</div></section> : null}
    {![data?.books.length, !memberView && data?.members.length, !memberView && data?.authors.length, !memberView && data?.categories.length].some(Boolean) && <div className="panel py-14 text-center"><Search size={29} className="mx-auto muted"/><p className="mt-3 font-semibold">No results found</p><p className="mt-1 text-xs muted">Try a book title, ISBN, member name, or category.</p></div>}
  </div>;
}
