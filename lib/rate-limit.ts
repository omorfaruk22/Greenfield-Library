import { connectDB } from '@/lib/mongodb';
import RateLimit from '@/models/RateLimit';

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<{ allowed: boolean; remaining: number }> {
  await connectDB();
  const now = new Date();
  let record = await RateLimit.findOneAndUpdate(
    { key, resetAt: { $gt: now } }, { $inc: { count: 1 } }, { new: true },
  ).lean();
  if (!record) {
    try {
      record = await RateLimit.findOneAndUpdate(
        { key }, { $set: { count: 1, resetAt: new Date(now.getTime() + windowMs) } }, { new: true, upsert: true, setDefaultsOnInsert: true },
      ).lean();
    } catch {
      record = await RateLimit.findOneAndUpdate({ key, resetAt: { $gt: now } }, { $inc: { count: 1 } }, { new: true }).lean();
    }
  }
  const count = record?.count ?? limit + 1;
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}
