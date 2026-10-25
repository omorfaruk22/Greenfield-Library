import type { LucideIcon } from 'lucide-react';
export function StatCard({ label, value, note, icon: Icon, tone = 'green' }: { label: string; value: string | number; note: string; icon: LucideIcon; tone?: 'green' | 'blue' | 'amber' | 'rose' }) {
  const tones = { green: { bg: 'rgba(8,132,92,.10)', fg: 'var(--primary)' }, blue: { bg: 'rgba(59,130,246,.10)', fg: '#3b82f6' }, amber: { bg: 'rgba(217,119,6,.11)', fg: '#d97706' }, rose: { bg: 'rgba(225,29,72,.10)', fg: '#e11d48' } };
  const color = tones[tone];
  return <article className="panel p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-medium muted">{label}</p><p className="mt-3 text-2xl font-bold tracking-tight sm:text-[28px]">{typeof value === 'number' ? value.toLocaleString('en-US') : value}</p></div><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{background:color.bg,color:color.fg}}><Icon size={19}/></div></div><p className="mt-3 text-[11px] muted">{note}</p></article>;
}
