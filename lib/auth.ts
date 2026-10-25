import 'server-only';
import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Session from '@/models/Session';
import type { SafeUser, UserRole } from '@/types';

const COOKIE_NAME = 'lms_session';
const SESSION_DAYS = 7;
function hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}
export async function createSession(userId: string, userAgent = '', rememberMe = false): Promise<void> {
  await connectDB();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + (rememberMe ? 30 : SESSION_DAYS) * 86400000);
  await Session.create({ tokenHash: hashToken(token), userId, expiresAt, userAgent: userAgent.slice(0, 400) });
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: expiresAt,
  });
}
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) {
    await connectDB();
    await Session.deleteOne({ tokenHash: hashToken(token) });
  }
  jar.delete(COOKIE_NAME);
}
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const jar = await cookies();
    const token = jar.get(COOKIE_NAME)?.value;
    if (!token) return null;
    await connectDB();
    const session = await Session.findOne({ tokenHash: hashToken(token), expiresAt: { $gt: new Date() } }).lean();
    if (!session) return null;
    const user = await User.findOne({ _id: session.userId, status: 'Active' }).lean();
    if (!user) return null;
    return { id: String(user._id), name: user.name, email: user.email, role: user.role as UserRole, status: user.status, image: user.image || '' };
  } catch (error) {
    console.error('[auth] Unable to read current session:', error instanceof Error ? error.message : 'unknown error');
    return null;
  }
}
export async function requireCurrentUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHENTICATED');
  return user;
}
