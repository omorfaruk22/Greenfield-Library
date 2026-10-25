import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import type { SafeUser, UserRole } from '@/types';

export type GuardResult = { user: SafeUser; response?: never } | { user?: never; response: NextResponse };
export async function authorize(roles?: UserRole[]): Promise<GuardResult> {
  const user = await getCurrentUser();
  if (!user) return { response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) };
  if (roles && !roles.includes(user.role)) return { response: NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 }) };
  return { user };
}
export const STAFF_ROLES: UserRole[] = ['Admin', 'Librarian'];
export const ADMIN_ROLES: UserRole[] = ['Admin'];
