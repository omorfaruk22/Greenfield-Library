'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { passwordChangeSchema } from '@/lib/validators/auth';
import { apiRequest } from '@/lib/api-client';
import type { z } from 'zod';

type PasswordInput = z.input<typeof passwordChangeSchema>;
type PasswordOutput = z.output<typeof passwordChangeSchema>;

export function PasswordChangeForm() {
  const [visible, setVisible] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordInput, unknown, PasswordOutput>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  async function submit(values: PasswordOutput) {
    try {
      const result = await apiRequest<{ message: string }>('/api/auth/password', { method: 'POST', body: JSON.stringify(values) });
      toast.success(result.message);
      reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update password.');
    }
  }

  return <section className="panel p-5 sm:p-6">
    <div className="mb-5 flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(8,132,92,.1)', color: 'var(--primary)' }}><KeyRound size={19} /></div><div><h2 className="font-bold">Change password</h2><p className="mt-1 text-xs muted">Your password is securely hashed. Updating it signs out other sessions.</p></div></div>
    <form onSubmit={handleSubmit(submit)} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><label className="label" htmlFor="currentPassword">Current password</label><input className="input" id="currentPassword" type={visible ? 'text' : 'password'} autoComplete="current-password" aria-invalid={!!errors.currentPassword} {...register('currentPassword')} />{errors.currentPassword && <p className="mt-1 text-xs text-rose-600">{errors.currentPassword.message}</p>}</div>
      <div><label className="label" htmlFor="newPassword">New password</label><input className="input" id="newPassword" type={visible ? 'text' : 'password'} autoComplete="new-password" aria-invalid={!!errors.newPassword} {...register('newPassword')} />{errors.newPassword && <p className="mt-1 text-xs text-rose-600">{errors.newPassword.message}</p>}</div>
      <div><label className="label" htmlFor="confirmPassword">Confirm new password</label><input className="input" id="confirmPassword" type={visible ? 'text' : 'password'} autoComplete="new-password" aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />{errors.confirmPassword && <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2"><label className="flex items-center gap-2 text-xs muted"><input type="checkbox" className="h-4 w-4" checked={visible} onChange={(event) => setVisible(event.target.checked)} /> Show passwords</label><button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? <LoaderCircle size={15} className="animate-spin" /> : <ShieldCheck size={15} />}Update password</button></div>
    </form>
  </section>;
}
