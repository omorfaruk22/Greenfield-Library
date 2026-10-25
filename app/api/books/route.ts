import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize, STAFF_ROLES } from '@/lib/permissions';
import { bookSchema } from '@/lib/validators/book';
import { getPagination, toSlug } from '@/lib/utils';
import { isDuplicateKey, readJson, serverError, validationError } from '@/lib/http';
import { writeAuditLog } from '@/lib/audit';
import Book from '@/models/Book';
import Author from '@/models/Author';
import Category from '@/models/Category';
import Publisher from '@/models/Publisher';
import BorrowingRecord from '@/models/BorrowingRecord';

export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const { page, pageSize, skip } = getPagination(url);
    const search = (url.searchParams.get('q') || '').trim().slice(0, 120);
    const categoryId = url.searchParams.get('categoryId');
    const availability = url.searchParams.get('availability');
    const filter: Record<string, unknown> = { archivedAt: null };
    if (search) filter.$text = { $search: search };
    if (categoryId && /^[a-f\d]{24}$/i.test(categoryId)) filter.categoryId = categoryId;
    if (availability === 'available') filter.availableCopies = { $gt: 0 };
    if (availability === 'unavailable') filter.availableCopies = 0;
    const [items, total] = await Promise.all([
      Book.find(filter).select('-__v').populate('authorIds', 'name').populate('categoryId', 'name slug').populate('publisherId', 'name').sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      Book.countDocuments(filter),
    ]);
    return NextResponse.json({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) { return serverError('books/list', error); }
}

export async function POST(request: NextRequest) {
  const access = await authorize(STAFF_ROLES);
  if (access.response) return access.response;
  try {
    const body = await readJson(request);
    const parsed = bookSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error)!;
    await connectDB();
    const data = parsed.data;
    const [authorCount, category, publisher] = await Promise.all([
      Author.countDocuments({ _id: { $in: data.authorIds } }),
      Category.findById(data.categoryId),
      data.publisherId ? Publisher.findById(data.publisherId) : Promise.resolve(null),
    ]);
    if (authorCount !== data.authorIds.length) return NextResponse.json({ error: 'One or more selected authors do not exist.' }, { status: 422 });
    if (!category || category.status !== 'Active') return NextResponse.json({ error: 'Select an active category.' }, { status: 422 });
    if (data.publisherId && !publisher) return NextResponse.json({ error: 'Selected publisher does not exist.' }, { status: 422 });
    const slugBase = toSlug(data.title);
    const slug = `${slugBase}-${Date.now().toString(36)}`;
    const book = await Book.create({ ...data, isbn: data.isbn || undefined, publisherId: data.publisherId || undefined, slug, createdBy: access.user.id, updatedBy: access.user.id });
    await writeAuditLog({ actor: access.user, action: 'book.created', resourceType: 'Book', resourceId: book._id.toString(), after: { title: book.title, isbn: book.isbn, totalCopies: book.totalCopies } });
    return NextResponse.json({ item: book }, { status: 201 });
  } catch (error) {
    const validation = validationError(error); if (validation) return validation;
    if (isDuplicateKey(error)) return NextResponse.json({ error: 'A book with this ISBN already exists.' }, { status: 409 });
    return serverError('books/create', error);
  }
}
