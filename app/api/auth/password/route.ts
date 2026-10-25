import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize } from '@/lib/permissions';
import { passwordChangeSchema } from '@/lib/validators/auth';
import { createSession, hashPassword, verifyPassword } from '@/lib/auth';
import { readJson, serverError, validationError } from '@/lib/http';
import { rateLimit } from '@/lib/rate-limit';
import { writeAuditLog } from '@/lib/audit';
import User from '@/models/User';
import Session from '@/models/Session';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const access = await authorize(['Admin', 'Librarian', 'Member']);
  if (access.response) return access.response;
  try {
    const limiter = await rateLimit(`password-change:${access.user.id}`, 5, 15 * 60 * 1000);
    if (!limiter.allowed) return NextResponse.json({ error: 'Too many password-change attempts. Please wait and try again.' }, { status: 429 });
    const parsed = passwordChangeSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error)!;
    await connectDB();
    const user = await User.findById(access.user.id).select('+passwordHash');
    if (!user || !(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }
    user.passwordHash = await hashPassword(parsed.data.newPassword);
    await user.save();
    await Session.deleteMany({ userId: user._id });
    await createSession(user._id.toString(), request.headers.get('user-agent') || '');
    await writeAuditLog({ actor: access.user, action: 'account.password_changed', resourceType: 'User', resourceId: user._id.toString() });
    return NextResponse.json({ success: true, message: 'Password updated. Other active sessions have been signed out.' });
  } catch (error) {
    const validation = validationError(error);
    if (validation) return validation;
    return serverError('auth/password-change', error);
  }
}
