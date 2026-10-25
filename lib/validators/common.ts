import { z } from 'zod';
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
export const paginationSchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(5).max(100).default(10) });
export const safeUrlSchema = z.string().trim().max(1000).refine((value) => value === '' || /^https?:\/\//i.test(value), 'Use a valid http or https URL').optional().default('');
