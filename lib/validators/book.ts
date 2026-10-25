import { z } from 'zod';
import { objectIdSchema, safeUrlSchema } from './common';
export const bookSchema = z.object({
  title: z.string().trim().min(1).max(220), subtitle: z.string().trim().max(220).optional().default(''),
  isbn: z.string().trim().max(30).optional().default(''), authorIds: z.array(objectIdSchema).min(1, 'Select at least one author').max(20),
  categoryId: objectIdSchema, publisherId: objectIdSchema.optional().or(z.literal('')).default(''),
  publicationYear: z.coerce.number().int().min(1000).max(new Date().getFullYear() + 1).optional(),
  edition: z.string().trim().max(80).optional().default(''), language: z.string().trim().min(1).max(80).default('English'),
  description: z.string().trim().max(5000).optional().default(''), coverImageUrl: safeUrlSchema,
  totalCopies: z.coerce.number().int().min(0).max(100000), availableCopies: z.coerce.number().int().min(0).max(100000),
  shelfLocation: z.string().trim().max(80).optional().default(''),
}).refine((v) => v.availableCopies <= v.totalCopies, { path: ['availableCopies'], message: 'Available copies cannot exceed total copies' });
