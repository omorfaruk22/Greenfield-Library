import { z } from 'zod';
import { objectIdSchema } from './common';
export const issueSchema = z.object({ memberId: objectIdSchema, bookId: objectIdSchema, loanDays: z.coerce.number().int().min(1).max(365).optional() });
export const paymentSchema = z.object({ fineId: objectIdSchema, amount: z.coerce.number().positive().max(10000000), paymentMethod: z.enum(['Cash', 'Mobile banking', 'Card', 'Bank transfer', 'Other']).default('Cash'), reference: z.string().trim().max(160).optional().default('') });
export const reservationSchema = z.object({ bookId: objectIdSchema });
export const authorSchema = z.object({ name: z.string().trim().min(2).max(120), biography: z.string().trim().max(3000).optional().default(''), nationality: z.string().trim().max(80).optional().default(''), birthDate: z.string().optional().default(''), imageUrl: z.string().trim().max(1000).optional().default('') });
export const categorySchema = z.object({ name: z.string().trim().min(2).max(100), slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional().default(''), description: z.string().trim().max(1000).optional().default(''), status: z.enum(['Active', 'Inactive']).default('Active') });
export const publisherSchema = z.object({ name: z.string().trim().min(2).max(140), email: z.string().email().or(z.literal('')).optional().default(''), phone: z.string().trim().max(30).optional().default(''), address: z.string().trim().max(400).optional().default(''), website: z.string().trim().max(1000).optional().default('') });
