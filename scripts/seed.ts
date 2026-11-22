import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { loadEnvConfig } from '@next/env';
import Book from '../models/Book';
import Author from '../models/Author';
import Category from '../models/Category';
import Publisher from '../models/Publisher';
import User from '../models/User';
import LibrarySettings from '../models/LibrarySettings';

async function main() {
  loadEnvConfig(process.cwd());
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required. Copy .env.example to .env.local and configure your database.');
  const adminName = process.env.SEED_ADMIN_NAME?.trim() || 'Library Administrator';
  const adminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const resetAdmin = process.argv.includes('--reset-admin');
  if (!adminEmail || !adminPassword || adminPassword.length < 12) throw new Error('Set SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 12 characters before seeding.');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    const [existingAdmin, categoriesExist] = await Promise.all([User.findOne({ email: adminEmail }), Category.exists({})]);
    if (!existingAdmin) {
      await User.create({ name: adminName, email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 12), role: 'Admin', status: 'Active' });
      console.log('Created the configured administrator account.');
    } else if (resetAdmin) {
      existingAdmin.passwordHash = await bcrypt.hash(adminPassword, 12);
      existingAdmin.role = 'Admin';
      existingAdmin.status = 'Active';
      await existingAdmin.save();
      console.log('Promoted and reset the configured administrator account.');
    } else if (existingAdmin.role !== 'Admin') {
      throw new Error('SEED_ADMIN_EMAIL belongs to a non-admin account. Use "npm run seed -- --reset-admin" to explicitly promote it and set the configured password.');
    } else console.log('Administrator account already exists; leaving its credentials unchanged.');

    const categorySeeds = [
      { name: 'Fiction', slug: 'fiction', description: 'Novels, short stories, and imaginative literature.' },
      { name: 'Science & Technology', slug: 'science-technology', description: 'Science, engineering, computing, and technology.' },
      { name: 'History', slug: 'history', description: 'World history, biographies, and historical studies.' },
      { name: 'Education', slug: 'education', description: 'Teaching, learning, and academic reference.' },
      { name: 'Literature', slug: 'literature', description: 'Poetry, literary criticism, and classic works.' },
    ];
    const categories = new Map<string, string>();
    for (const item of categorySeeds) {
      const doc = await Category.findOneAndUpdate({ slug: item.slug }, { $setOnInsert: item }, { upsert: true, new: true, setDefaultsOnInsert: true });
      categories.set(item.slug, doc._id.toString());
    }
    const authorSeeds = [
      { name: 'Sample Author One', biography: 'A fictional author record for development and testing.', nationality: 'Bangladeshi' },
      { name: 'Sample Author Two', biography: 'A fictional author record used in the demo catalog.', nationality: 'British' },
      { name: 'Sample Author Three', biography: 'A fictional contributor to example educational titles.', nationality: 'American' },
    ];
    const authors = new Map<string, string>();
    for (const item of authorSeeds) {
      const doc = await Author.findOneAndUpdate({ name: item.name }, { $setOnInsert: item }, { upsert: true, new: true, setDefaultsOnInsert: true });
      authors.set(item.name, doc._id.toString());
    }
    const publisher = await Publisher.findOneAndUpdate({ name: 'Greenfield Academic Press' }, { $setOnInsert: { name: 'Greenfield Academic Press', email: '', phone: '', address: '' } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    const bookSeeds = [
      { title: 'Foundations of Computing', slug: 'foundations-of-computing', isbn: '9780000000001', author: 'Sample Author One', category: 'science-technology', year: 2022, copies: 8, shelf: 'ST-01-01', language: 'English', description: 'A fictional sample title covering core computing concepts.' },
      { title: 'The Quiet River', slug: 'the-quiet-river', isbn: '9780000000002', author: 'Sample Author Two', category: 'fiction', year: 2020, copies: 5, shelf: 'FIC-02-04', language: 'English', description: 'A fictional novel used as sample catalog data.' },
      { title: 'A Brief World History', slug: 'a-brief-world-history', isbn: '9780000000003', author: 'Sample Author Three', category: 'history', year: 2021, copies: 4, shelf: 'HIS-01-02', language: 'English', description: 'A demo reference title for the history collection.' },
      { title: 'Learning How to Learn', slug: 'learning-how-to-learn', isbn: '9780000000004', author: 'Sample Author One', category: 'education', year: 2023, copies: 6, shelf: 'EDU-01-03', language: 'English', description: 'A fictional guide to study and learning strategies.' },
      { title: 'Poems for Every Season', slug: 'poems-for-every-season', isbn: '9780000000005', author: 'Sample Author Two', category: 'literature', year: 2019, copies: 3, shelf: 'LIT-04-02', language: 'English', description: 'A sample poetry collection for catalog demonstrations.' },
      { title: 'Practical Web Engineering', slug: 'practical-web-engineering', isbn: '9780000000006', author: 'Sample Author Three', category: 'science-technology', year: 2024, copies: 7, shelf: 'ST-03-05', language: 'English', description: 'A sample technical title about building maintainable web applications.' },
    ];
    for (const item of bookSeeds) {
      const authorId = authors.get(item.author);
      const categoryId = categories.get(item.category);
      if (!authorId || !categoryId) throw new Error(`Missing seed relationship for book: ${item.title}`);
      await Book.findOneAndUpdate({ slug: item.slug }, { $setOnInsert: { title: item.title, slug: item.slug, isbn: item.isbn, authorIds: [authorId], categoryId, publisherId: publisher._id, publicationYear: item.year, language: item.language, description: item.description, totalCopies: item.copies, availableCopies: item.copies, shelfLocation: item.shelf, borrowingCount: 0, archivedAt: null } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    }
    await LibrarySettings.findOneAndUpdate({ key: 'default' }, { $setOnInsert: { key: 'default', libraryName: 'Greenfield Library' } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    console.log(`${categoriesExist ? 'Existing categories preserved; ' : ''}sample categories, authors, publisher, and books are ready.`);
    console.log('Seed completed. Change or keep the administrator password you configured in your local environment; do not commit it.');
  } finally {
    await mongoose.disconnect();
  }
}
main().catch((error: unknown) => { console.error('Seed failed:', error instanceof Error ? error.message : error); process.exitCode = 1; });
