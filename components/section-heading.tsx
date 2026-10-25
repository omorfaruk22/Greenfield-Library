import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
export function SectionHeading({ title, description, icon: Icon, action }: { title: string; description: string; icon?: LucideIcon; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="flex items-start gap-3">{Icon && <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{background:'rgba(8,132,92,.1)',color:'var(--primary)'}}><Icon size={19}/></div>}<div><h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1><p className="mt-1.5 max-w-2xl text-sm muted">{description}</p></div></div>{action}</div>;
}
