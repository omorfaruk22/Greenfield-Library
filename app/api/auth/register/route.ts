import { NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validators/auth';
import { connectDB } from '@/lib/mongodb';
import { hashPassword, createSession } from '@/lib/auth';
import { getLibrarySettings } from '@/lib/settings';
import { isDuplicateKey, readJson, serverError, validationError } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import User from '@/models/User';
import Member from '@/models/Member';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limit = await rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many registration attempts. Please wait and try again.' }, { status: 429 });
    const body = await readJson(request);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error)!;
    await connectDB();
    const settings = await getLibrarySettings();
    if (!settings.publicMemberRegistration) return NextResponse.json({ error: 'Public registration is currently disabled. Please contact the library.' }, { status: 403 });
    const { name, email, password, phone } = parsed.data;
    if (await User.exists({ email }) || await Member.exists({ email })) return NextResponse.json({ error: 'Unable to create this account with the provided details.' }, { status: 409 });
    const user = await User.create({ name, email, passwordHash: await hashPassword(password), role: 'Member', status: 'Active' });
    try {
      await Member.create({
        memberId: `MEM-${new Date().getFullYear()}-${user._id.toString().slice(-6).toUpperCase()}`,
        userId: user._id, fullName: name, email, phone, membershipType: 'Student', status: 'Active',
        registrationDate: new Date(), borrowingLimit: settings.defaultBorrowingLimit,
      });
    } catch (error) {
      await User.deleteOne({ _id: user._id });
      throw error;
    }
    await createSession(user._id.toString(), request.headers.get('user-agent') || '');
    return NextResponse.json({ user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (error) {
    const validation = validationError(error);
    if (validation) return validation;
    if (isDuplicateKey(error)) return NextResponse.json({ error: 'Unable to create this account with the provided details.' }, { status: 409 });
    return serverError('auth/register', error);
  }
}
