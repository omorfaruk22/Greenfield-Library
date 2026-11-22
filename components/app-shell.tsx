'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Activity, AlarmClock, ArrowLeftRight, Bell, BookMarked, BookOpen, Building2, CalendarClock,
  CircleDollarSign, CreditCard, FileBarChart, Home, Library, LogOut, Menu, Moon, PanelLeftClose,
  Search, Settings, ShieldCheck, Sun, Tags,
  UserRound, Users, X, type LucideIcon,
} from 'lucide-react';
import type { SafeUser, UserRole } from '@/types';
import { clearApiRequestCache, prefetchApiRequest } from '@/lib/api-client';

type MenuItem = { label: string; href: string; icon: LucideIcon; group?: string };
const adminItems: MenuItem[] = [
  { label: 'Overview', href: '/admin/dashboard', icon: Home, group: 'Workspace' },
  { label: 'Books', href: '/admin/books', icon: BookOpen },
  { label: 'Members', href: '/admin/members', icon: Users },
  { label: 'Borrowing desk', href: '/admin/borrowings', icon: ArrowLeftRight },
  { label: 'Book returns', href: '/admin/returns', icon: BookMarked },
  { label: 'Reservations', href: '/admin/reservations', icon: CalendarClock },
  { label: 'Overdue & fines', href: '/admin/fines', icon: AlarmClock },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard, group: 'Library data' },
  { label: 'Authors', href: '/admin/authors', icon: UserRound },
  { label: 'Categories', href: '/admin/categories', icon: Tags },
  { label: 'Publishers', href: '/admin/publishers', icon: Building2 },
  { label: 'Reports', href: '/admin/reports', icon: FileBarChart, group: 'Administration' },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
  { label: 'User access', href: '/admin/users', icon: ShieldCheck },
  { label: 'Library settings', href: '/admin/settings', icon: Settings },
  { label: 'Audit trail', href: '/admin/audit-logs', icon: Activity },
];
const memberItems: MenuItem[] = [
  { label: 'My dashboard', href: '/member/dashboard', icon: Home, group: 'My Library' },
  { label: 'Book catalog', href: '/member/catalog', icon: BookOpen },
  { label: 'Search catalog', href: '/member/search', icon: Search },
  { label: 'My borrowed books', href: '/member/my-books', icon: BookMarked },
  { label: 'My reservations', href: '/member/my-reservations', icon: CalendarClock },
  { label: 'My fines', href: '/member/my-fines', icon: CircleDollarSign },
  { label: 'Notifications', href: '/member/notifications', icon: Bell },
  { label: 'My profile', href: '/member/profile', icon: UserRound, group: 'Account' },
];

const pageDataPrefetch: Record<string, string[]> = {
  '/admin/members': ['/api/members?page=1&pageSize=10'],
  '/admin/borrowings': ['/api/borrowings?page=1&pageSize=10&status=active&q=', '/api/members?page=1&pageSize=100', '/api/books?page=1&pageSize=100&availability=available'],
  '/admin/returns': ['/api/borrowings?page=1&pageSize=10&status=active&q=', '/api/members?page=1&pageSize=100', '/api/books?page=1&pageSize=100&availability=available'],
  '/admin/reservations': ['/api/reservations?page=1&pageSize=10'],
  '/admin/fines': ['/api/borrowings?status=active&overdue=true&page=1&pageSize=100&q=', '/api/fines?page=1&pageSize=10'],
  '/admin/payments': ['/api/payments?page=1&pageSize=10'],
  '/admin/authors': ['/api/metadata/authors?page=1&pageSize=10'],
  '/admin/categories': ['/api/metadata/categories?page=1&pageSize=10'],
  '/admin/publishers': ['/api/metadata/publishers?page=1&pageSize=10'],
  '/admin/notifications': ['/api/notifications?page=1&pageSize=50'],
  '/admin/users': ['/api/users?page=1&pageSize=10'],
  '/admin/settings': ['/api/settings'],
  '/admin/audit-logs': ['/api/audit-logs?page=1&pageSize=10'],
  '/member/catalog': ['/api/books?page=1&pageSize=12&q='],
  '/member/my-books': ['/api/borrowings?page=1&pageSize=10&status=active&q='],
  '/member/my-reservations': ['/api/reservations?page=1&pageSize=10'],
  '/member/my-fines': ['/api/fines?page=1&pageSize=10', '/api/payments?page=1&pageSize=10'],
  '/member/notifications': ['/api/notifications?page=1&pageSize=50'],
  '/member/profile': ['/api/member/profile'],
};

export function AppShell({ user, children }: { user: SafeUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState('');
  const prefetchedMenu = useRef(new Set<string>());
  const items = user.role === 'Member' ? memberItems : user.role === 'Admin' ? adminItems : adminItems.filter((item) => !['/admin/users', '/admin/settings', '/admin/audit-logs'].includes(item.href));

  useEffect(() => {
    const preference = localStorage.getItem('lms-theme');
    const enabled = preference === 'dark';
    setDark(enabled);
    document.documentElement.classList.toggle('dark', enabled);
  }, []);
  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('lms-theme', next ? 'dark' : 'light');
  };
  const activeLabel = useMemo(() => items.find((item) => pathname === item.href || (item.href !== '/admin/dashboard' && item.href !== '/member/dashboard' && pathname.startsWith(item.href)))?.label || 'Workspace', [items, pathname]);
  async function logout() {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Could not sign out. Try again.');
      clearApiRequestCache();
      toast.success('You have signed out.');
      router.replace('/login'); router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Sign out failed.'); }
  }
  function doSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    router.push(user.role === 'Member' ? `/member/search?q=${encodeURIComponent(value)}` : `/admin/search?q=${encodeURIComponent(value)}`);
  }
  function prefetchMenuItem(item: MenuItem) {
    if (prefetchedMenu.current.has(item.href)) return;
    prefetchedMenu.current.add(item.href);
    router.prefetch(item.href);
    pageDataPrefetch[item.href]?.forEach(prefetchApiRequest);
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => <aside className={`flex h-full flex-col border-r ${mobile ? 'w-[276px]' : collapsed ? 'w-[84px]' : 'w-[252px]'} transition-[width] duration-200`} style={{ background: 'var(--surface)', borderColor: 'var(--line)' }}>
    <div className="flex h-[78px] items-center gap-3 border-b px-5" style={{ borderColor: 'var(--line)' }}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: 'var(--primary)' }}><Library size={22} /></div>
      {(mobile || !collapsed) && <div className="min-w-0"><p className="truncate text-[15px] font-bold tracking-tight">Greenfield</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.17em] muted">Library workspace</p></div>}
      {mobile && <button className="ml-auto rounded-lg p-2 hover:bg-black/5" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button>}
    </div>
    <div className="flex-1 overflow-y-auto px-3 py-4">
      {items.map((item, index) => {
        const active = pathname === item.href || (item.href !== '/admin/dashboard' && item.href !== '/member/dashboard' && pathname.startsWith(item.href));
        const prevGroup = items[index - 1]?.group;
        return <div key={item.href}>
          {item.group && <p className={`px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[.16em] muted ${index === 0 ? '!pt-1' : ''}`}>{mobile || !collapsed ? item.group : ''}</p>}
          {!item.group && index > 0 && prevGroup && null}
          <Link prefetch={false} onMouseEnter={() => prefetchMenuItem(item)} onFocus={() => prefetchMenuItem(item)} onTouchStart={() => prefetchMenuItem(item)} onClick={() => mobile && setMobileOpen(false)} href={item.href} title={item.label} className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${active ? 'text-white shadow-sm' : 'hover:bg-black/[.04] dark:hover:bg-white/[.05]'}`} style={active ? { background: 'var(--primary)' } : { color: 'var(--muted)' }}>
            <item.icon size={18} strokeWidth={active ? 2.2 : 1.8} className="shrink-0" />
            {(mobile || !collapsed) && <><span className="flex-1">{item.label}</span>{active && <span className="h-1.5 w-1.5 rounded-full bg-white/80" />}</>}
          </Link>
        </div>;
      })}
    </div>
    <div className="border-t p-3" style={{ borderColor: 'var(--line)' }}>
      <div className={`flex items-center gap-3 rounded-xl p-2 ${mobile || !collapsed ? '' : 'justify-center'}`}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: 'rgba(8,132,92,.13)', color: 'var(--primary)' }}>{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</div>
        {(mobile || !collapsed) && <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{user.name}</p><p className="mt-0.5 text-[10px] muted">{user.role}</p></div>}
      </div>
      {(mobile || !collapsed) && <button onClick={logout} className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><LogOut size={15} /> Sign out</button>}
    </div>
  </aside>;

  return <div className="min-h-screen" style={{ background: 'var(--page)' }}>
    <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block"><Sidebar /></div>
    {mobileOpen && <div className="fixed inset-0 z-50 flex lg:hidden"><button className="absolute inset-0 bg-slate-950/40" aria-label="Close navigation" onClick={() => setMobileOpen(false)} /><div className="relative h-full shadow-2xl"><Sidebar mobile /></div></div>}
    <div className={`min-h-screen transition-[padding] ${collapsed ? 'lg:pl-[84px]' : 'lg:pl-[252px]'}`}>
      <header className="sticky top-0 z-20 flex h-[78px] items-center gap-3 border-b px-4 sm:px-7" style={{ background: 'color-mix(in srgb, var(--surface) 94%, transparent)', borderColor: 'var(--line)', backdropFilter: 'blur(14px)' }}>
        <button onClick={() => setMobileOpen(true)} className="rounded-xl p-2 hover:bg-black/5 lg:hidden" aria-label="Open navigation"><Menu size={20} /></button>
        <button onClick={() => setCollapsed((value) => !value)} className="hidden rounded-xl p-2 muted hover:bg-black/5 lg:inline-flex" aria-label="Toggle sidebar"><PanelLeftClose size={18} /></button>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[11px] muted"><span>Library</span><span>/</span><span style={{ color: 'var(--primary)' }}>{activeLabel}</span></div><h1 className="mt-1 truncate text-[16px] font-bold tracking-tight sm:text-lg">{activeLabel}</h1></div>
        <form onSubmit={doSearch} className="hidden w-[min(28vw,270px)] items-center gap-2 rounded-xl border px-3 py-2 md:flex" style={{ background: 'var(--page)', borderColor: 'var(--line)' }}><Search size={15} className="muted" /><input aria-label="Search library" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search books, members..." className="min-w-0 flex-1 bg-transparent text-xs outline-none" /><kbd className="rounded border px-1.5 py-0.5 text-[10px] muted" style={{ borderColor: 'var(--line)' }}>↵</kbd></form>
        <button className="relative rounded-xl border p-2.5 transition hover:bg-black/[.04]" aria-label="Notifications" style={{ borderColor: 'var(--line)' }} onClick={() => router.push(user.role === 'Member' ? '/member/notifications' : '/admin/notifications')}><Bell size={17} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full" style={{ background: 'var(--primary)' }} /></button>
        <button onClick={toggleTheme} className="rounded-xl border p-2.5 transition hover:bg-black/[.04]" aria-label="Toggle color theme" style={{ borderColor: 'var(--line)' }}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>
        <button onClick={() => router.push(user.role === 'Member' ? '/member/profile' : '/admin/profile')} className="hidden h-9 w-9 items-center justify-center rounded-full text-xs font-bold sm:flex" style={{ background: 'rgba(8,132,92,.13)', color: 'var(--primary)' }}>{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</button>
      </header>
      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-7 sm:py-8">{children}</main>
      <footer className="px-7 pb-6 pt-3 text-center text-[11px] muted">© {new Date().getFullYear()} Greenfield Library · Thoughtful reading, smarter operations.</footer>
    </div>
  </div>;
}
