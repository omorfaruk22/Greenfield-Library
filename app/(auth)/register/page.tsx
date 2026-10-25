'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { BookOpen, Eye, EyeOff, LibraryBig } from 'lucide-react';
import { toast } from 'sonner';
import { registerSchema } from '@/lib/validators/auth';
import type { z } from 'zod';

type RegisterInput = z.input<typeof registerSchema>;
type RegisterOutput = z.output<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput, unknown, RegisterOutput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', phone: '', password: '' },
  });

  async function submit(values: RegisterOutput) {
    try {
      const response = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed.');
      toast.success('Your member account is ready.');
      router.replace('/member/dashboard');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed.');
    }
  }

  return <main className="flex min-h-screen items-center justify-center px-4 py-12" style={{ background: 'var(--page)' }}><div className="panel w-full max-w-[480px] p-6 sm:p-9">
    <Link href="/" className="mb-8 inline-flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl text-white" style={{ background: 'var(--primary)' }}><LibraryBig size={22} /></span><span><strong className="block">Greenfield Library</strong><small className="muted">Member registration</small></span></Link>
    <div className="mb-7"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'rgba(8,132,92,.1)', color: 'var(--primary)' }}><BookOpen size={22} /></div><h1 className="text-2xl font-bold tracking-tight">Create your member account</h1><p className="mt-2 text-sm muted">Register to browse books and manage your reading list.</p></div>
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      <div><label className="label" htmlFor="name">Full name</label><input id="name" className="input" autoComplete="name" aria-invalid={!!errors.name} placeholder="Your full name" {...register('name')} />{errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name.message}</p>}</div>
      <div><label className="label" htmlFor="email">Email address</label><input id="email" className="input" type="email" autoComplete="email" aria-invalid={!!errors.email} placeholder="you@example.com" {...register('email')} />{errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>}</div>
      <div><label className="label" htmlFor="phone">Phone (optional)</label><input id="phone" className="input" autoComplete="tel" placeholder="+880…" {...register('phone')} />{errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>}</div>
      <div><label className="label" htmlFor="password">Password</label><div className="relative"><input id="password" className="input pr-11" type={showPassword ? 'text' : 'password'} autoComplete="new-password" aria-invalid={!!errors.password} placeholder="At least 10 characters" {...register('password')} /><button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 muted" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>}</div>
      <button className="btn-primary w-full py-3" disabled={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create member account'}</button>
    </form>
    <p className="mt-6 text-center text-sm muted">Already registered? <Link href="/login" className="font-semibold" style={{ color: 'var(--primary)' }}>Sign in</Link></p><p className="mt-4 text-[11px] leading-5 muted">Public registration creates a Member account only. Staff and administrator accounts must be created by an authorized administrator.</p>
  </div></main>;
}
