import { connectDB } from '@/lib/mongodb';
import LibrarySettings from '@/models/LibrarySettings';

export async function getLibrarySettings() {
  await connectDB();
  const settings = await LibrarySettings.findOneAndUpdate({ key: 'default' }, { $setOnInsert: { key: 'default' } }, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();
  return settings;
}
