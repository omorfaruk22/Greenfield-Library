import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getCurrentUser } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role === 'Member') redirect('/member/dashboard');
  return <AppShell user={user}>{children}</AppShell>;
}
