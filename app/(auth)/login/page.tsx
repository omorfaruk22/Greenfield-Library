'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { BookOpen, Eye, EyeOff, LibraryBig, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { loginSchema } from '@/lib/validators/auth';
import type { z } from 'zod';

type LoginInput = z.input<typeof loginSchema>;
type LoginOutput = z.output<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput, unknown, LoginOutput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  async function submit(values: LoginOutput) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to sign in.');
      toast.success('Welcome back.');
      router.replace(data.user?.role === 'Member' ? '/member/dashboard' : '/admin/dashboard');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sign in failed.');
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2" style={{ background: 'var(--surface)' }}>
      <section className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between" style={{ background: '#075c43' }}>
        <div className="absolute -right-36 -top-24 h-[540px] w-[540px] rounded-full border border-white/10" />
        <div className="absolute -bottom-48 -left-28 h-[560px] w-[560px] rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><LibraryBig size={23} /></div><div><p className="font-bold">Greenfield Library</p><p className="mt-0.5 text-[10px] uppercase tracking-[.18em] text-emerald-100/70">Management workspace</p></div></div>
        <div className="relative max-w-xl"><span className="text-sm font-semibold text-emerald-200">A better reading ecosystem</span><h1 className="mt-5 text-5xl font-bold leading-[1.12] tracking-tight">Bring your library to life.</h1><p className="mt-5 max-w-md text-sm leading-7 text-emerald-50/75">Thoughtful tools for every shelf, every reader, and every part of the library day.</p><div className="mt-10 space-y-4">{[['01', 'A catalog your team can trust'], ['02', 'Clear, reliable circulation workflows'], ['03', 'Secure access for every role']].map(([num, text]) => <div key={num} className="flex items-center gap-4"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-xs font-bold text-emerald-100">{num}</span><span className="text-sm text-emerald-50/90">{text}</span></div>)}</div></div>
        <p className="relative text-xs text-emerald-100/60">© {new Date().getFullYear()} Greenfield Library. Built for curious minds.</p>
      </section>
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-9 flex items-center gap-3 lg:hidden"><div className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: 'var(--primary)' }}><LibraryBig size={22} /></div><div><p className="font-bold">Greenfield Library</p><p className="text-xs muted">Management workspace</p></div></div>
          <div className="mb-8"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'rgba(8,132,92,.1)', color: 'var(--primary)' }}><BookOpen size={24} /></div><h2 className="text-3xl font-bold tracking-tight">Welcome back</h2><p className="mt-2 text-sm muted">Sign in to continue to your library workspace.</p></div>
          <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
            <div><label className="label" htmlFor="email">Email address</label><input id="email" type="email" autoComplete="email" className="input" placeholder="you@institution.edu" aria-invalid={!!errors.email} {...register('email')} />{errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}</div>
            <div><div className="mb-1.5 flex items-center justify-between"><label className="label !mb-0" htmlFor="password">Password</label><span className="text-[11px] muted">Contact admin to reset</span></div><div className="relative"><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="input pr-11" placeholder="Enter your password" aria-invalid={!!errors.password} {...register('password')} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 muted" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}</div>
            <label className="flex items-center gap-2 text-xs muted"><input type="checkbox" {...register('remember')} className="h-4 w-4 rounded" /> Keep me signed in on this device</label>
            <button className="btn-primary w-full py-3" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in securely'} <ShieldCheck size={16} /></button>
          </form>
          <p className="mt-6 text-center text-sm muted">New to the library? <Link className="font-semibold" style={{ color: 'var(--primary)' }} href="/register">Create a member account</Link></p><p className="mt-8 text-center text-[11px] muted">By continuing, you agree to follow your library&apos;s account and borrowing policies.</p>
        </div>
      </section>
    </main>
  );
}
