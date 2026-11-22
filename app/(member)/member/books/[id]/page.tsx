import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import { isValidObjectId } from '@/lib/utils';
import Book from '@/models/Book';
import { MemberBookDetail } from '@/components/member-book-detail';

type Context = { params: Promise<{ id: string }> };
type PopulatedAuthor = { _id: unknown; name: string; biography?: string };
type PopulatedCategory = { _id: unknown; name: string; slug: string };
type PopulatedPublisher = { _id: unknown; name: string };

export default async function MemberBookDetailsPage({ params }: Context) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();
  await connectDB();
  const record = await Book.findOne({ _id: id, archivedAt: null })
    .populate('authorIds', 'name biography')
    .populate('categoryId', 'name slug')
    .populate('publisherId', 'name')
    .lean();
  if (!record) notFound();
  const authors = (record.authorIds as unknown as PopulatedAuthor[]).map((author) => ({ id: String(author._id), name: author.name, biography: author.biography || '' }));
  const categoryDoc = record.categoryId as unknown as PopulatedCategory | null;
  const publisherDoc = record.publisherId as unknown as PopulatedPublisher | null;
  return <MemberBookDetail book={{
    id: String(record._id), title: record.title, subtitle: record.subtitle || '', isbn: record.isbn || '', language: record.language || 'English', edition: record.edition || '',
    publicationYear: record.publicationYear ?? undefined, description: record.description || '', coverImageUrl: record.coverImageUrl || '', shelfLocation: record.shelfLocation || '',
    totalCopies: record.totalCopies, availableCopies: record.availableCopies, authors,
    category: categoryDoc ? { id: String(categoryDoc._id), name: categoryDoc.name, slug: categoryDoc.slug } : null,
    publisher: publisherDoc ? { id: String(publisherDoc._id), name: publisherDoc.name } : null,
  }} />;
}
