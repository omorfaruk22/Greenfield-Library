import { redirect } from 'next/navigation';
import { UserRound } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { SectionHeading } from '@/components/section-heading';
import { PasswordChangeForm } from '@/components/password-change-form';

export default async function AdminProfilePage() {
  const user = await getCurrentUser();
  if (!user || user.role === 'Member') redirect('/login');
  return <div className="space-y-5"><SectionHeading title="My account" description="Review your staff account information and secure your sign-in." icon={UserRound} /><section className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6"><div className="flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold" style={{ background: 'rgba(8,132,92,.12)', color: 'var(--primary)' }}>{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div><div className="min-w-0 flex-1"><h2 className="text-lg font-bold">{user.name}</h2><p className="mt-1 text-sm muted">{user.email}</p></div><span className="w-fit rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: 'rgba(8,132,92,.1)', color: 'var(--primary)' }}>{user.role}</span></section><PasswordChangeForm /></div>;
}
