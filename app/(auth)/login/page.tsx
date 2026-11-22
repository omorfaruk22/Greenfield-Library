import { LoginForm, type LoginPortal } from '@/components/login-form';

type PageProps = { searchParams: Promise<{ portal?: string | string[] }> };

function resolvePortal(value?: string | string[]): LoginPortal | null {
  const selected = Array.isArray(value) ? value[0] : value;
  if (!selected) return null;
  if (selected.toLowerCase() === 'admin') return 'Admin';
  if (selected.toLowerCase() === 'staff' || selected.toLowerCase() === 'librarian') return 'Librarian';
  if (selected.toLowerCase() === 'member') return 'Member';
  return null;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { portal } = await searchParams;
  return <LoginForm initialPortal={resolvePortal(portal)} />;
}
