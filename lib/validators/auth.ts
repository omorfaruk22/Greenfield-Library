import { z } from 'zod';
export const loginSchema = z.object({ email: z.string().email().max(254).transform((v) => v.toLowerCase().trim()), password: z.string().min(1).max(200), remember: z.boolean().optional().default(false) });
export const registerSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().email().max(254).transform((v) => v.toLowerCase().trim()), password: z.string().min(10, 'Password must have at least 10 characters').max(200), phone: z.string().trim().max(30).optional().default('') });

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(10, 'New password must have at least 10 characters').max(200),
  confirmPassword: z.string().min(1).max(200),
}).refine((value) => value.newPassword === value.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' })
  .refine((value) => value.currentPassword !== value.newPassword, { path: ['newPassword'], message: 'Choose a password different from your current password.' });
