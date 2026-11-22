import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { createSession, verifyPassword } from '@/lib/auth';
import { loginSchema } from '@/lib/validators/auth';
import { readJson, serverError, validationError } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import User from '@/models/User';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const raw = await readJson(request);
    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) return validationError(parsed.error)!;
    const limit = await rateLimit(`login:${ip}:${parsed.data.email}`, 8, 15 * 60 * 1000);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many login attempts. Please try again later.' }, { status: 429 });
    await connectDB();
    const user = await User.findOne({ email: parsed.data.email }).select('+passwordHash');
    const passwordMatches = user ? await verifyPassword(parsed.data.password, user.passwordHash) : false;
    if (!user || !passwordMatches || user.status !== 'Active') return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    if (parsed.data.portal && user.role !== parsed.data.portal) {
      const portalLabel = parsed.data.portal === 'Librarian' ? 'Staff' : parsed.data.portal;
      return NextResponse.json({ error: `This account cannot use the ${portalLabel} sign-in. Choose the portal that matches your account role.` }, { status: 403 });
    }
    user.lastLoginAt = new Date();
    await user.save();
    await createSession(user._id.toString(), request.headers.get('user-agent') || '', parsed.data.remember);
    return NextResponse.json({ user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    const validation = validationError(error);
    if (validation) return validation;
    return serverError('auth/login', error);
  }
}
