import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize, STAFF_ROLES } from '@/lib/permissions';
import { bookSchema } from '@/lib/validators/book';
import { isValidObjectId, toSlug } from '@/lib/utils';
import { isDuplicateKey, readJson, serverError, validationError } from '@/lib/http';
import { writeAuditLog } from '@/lib/audit';
import Book from '@/models/Book';
import Author from '@/models/Author';
import Category from '@/models/Category';
import BorrowingRecord from '@/models/BorrowingRecord';

type Context = { params: Promise<{ id: string }> };
export const runtime = 'nodejs';
export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    await connectDB();
    const item = await Book.findOne({ _id: id, archivedAt: null }).populate('authorIds', 'name biography').populate('categoryId', 'name slug').populate('publisherId', 'name').lean();
    if (!item) return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    return NextResponse.json({ item });
  } catch (error) { return serverError('books/detail', error); }
}
export async function PATCH(request: Request, context: Context) {
  const access = await authorize(STAFF_ROLES); if (access.response) return access.response;
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    const body = await readJson(request); const parsed = bookSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error)!;
    await connectDB();
    const book = await Book.findOne({ _id: id, archivedAt: null });
    if (!book) return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    const borrowedCopies = await BorrowingRecord.countDocuments({ bookId: id, status: 'Borrowed' });
    if (parsed.data.totalCopies < borrowedCopies) return NextResponse.json({ error: `Total copies cannot be less than ${borrowedCopies} copies currently on loan.` }, { status: 409 });
    const authorCount = await Author.countDocuments({ _id: { $in: parsed.data.authorIds } });
    const category = await Category.findById(parsed.data.categoryId);
    if (authorCount !== parsed.data.authorIds.length || !category || category.status !== 'Active') return NextResponse.json({ error: 'Please select valid authors and an active category.' }, { status: 422 });
    const before = { title: book.title, totalCopies: book.totalCopies, availableCopies: book.availableCopies };
    Object.assign(book, parsed.data, { availableCopies: parsed.data.totalCopies - borrowedCopies, isbn: parsed.data.isbn || undefined, publisherId: parsed.data.publisherId || undefined, updatedBy: access.user.id });
    if (book.title !== before.title) book.slug = `${toSlug(book.title)}-${Date.now().toString(36)}`;
    await book.save();
    await writeAuditLog({ actor: access.user, action: 'book.updated', resourceType: 'Book', resourceId: id, before, after: { title: book.title, totalCopies: book.totalCopies, availableCopies: book.availableCopies } });
    return NextResponse.json({ item: book });
  } catch (error) {
    const validation = validationError(error); if (validation) return validation;
    if (isDuplicateKey(error)) return NextResponse.json({ error: 'A book with this ISBN already exists.' }, { status: 409 });
    return serverError('books/update', error);
  }
}
export async function DELETE(_request: Request, context: Context) {
  const access = await authorize(STAFF_ROLES); if (access.response) return access.response;
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    await connectDB();
    const activeLoans = await BorrowingRecord.countDocuments({ bookId: id, status: 'Borrowed' });
    if (activeLoans > 0) return NextResponse.json({ error: 'This book has active loans. Return the copies before archiving it.' }, { status: 409 });
    const item = await Book.findOneAndUpdate({ _id: id, archivedAt: null }, { $set: { archivedAt: new Date(), updatedBy: access.user.id } }, { new: true });
    if (!item) return NextResponse.json({ error: 'Book not found.' }, { status: 404 });
    await writeAuditLog({ actor: access.user, action: 'book.archived', resourceType: 'Book', resourceId: id, after: { title: item.title } });
    return NextResponse.json({ success: true });
  } catch (error) { return serverError('books/archive', error); }
}
