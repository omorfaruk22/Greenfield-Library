import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize } from '@/lib/permissions';
import { serverError } from '@/lib/http';
import Book from '@/models/Book';
import Author from '@/models/Author';
import Category from '@/models/Category';
import Member from '@/models/Member';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const access = await authorize(['Admin', 'Librarian', 'Member']);
  if (access.response) return access.response;
  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ query: q, books: [], members: [], authors: [], categories: [] });
  try {
    await connectDB();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(escaped, 'i');
    const [books, members, authors, categories] = await Promise.all([
      Book.find({ archivedAt: null, $or: [{ title: pattern }, { isbn: pattern }, { description: pattern }] }).select('title isbn coverImageUrl availableCopies totalCopies').sort({ title: 1 }).limit(8).lean(),
      access.user.role !== 'Member' ? Member.find({ $or: [{ fullName: pattern }, { memberId: pattern }, { email: pattern }] }).select('memberId fullName email status').sort({ fullName: 1 }).limit(8).lean() : Promise.resolve([]),
      access.user.role !== 'Member' ? Author.find({ name: pattern }).select('name nationality').sort({ name: 1 }).limit(6).lean() : Promise.resolve([]),
      access.user.role !== 'Member' ? Category.find({ name: pattern }).select('name slug status').sort({ name: 1 }).limit(6).lean() : Promise.resolve([]),
    ]);
    return NextResponse.json({ query: q, books, members, authors, categories });
  } catch (error) {
    return serverError('global-search', error);
  }
}
