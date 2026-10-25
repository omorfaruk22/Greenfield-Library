import { z } from 'zod';
export const memberSchema = z.object({
  fullName: z.string().trim().min(2).max(120), email: z.string().email().max(254).transform((v) => v.toLowerCase().trim()),
  phone: z.string().trim().max(30).optional().default(''), address: z.string().trim().max(300).optional().default(''),
  membershipType: z.enum(['Student', 'Teacher', 'Staff', 'General Member']).default('Student'),
  status: z.enum(['Active', 'Suspended', 'Expired']).default('Active'),
  borrowingLimit: z.coerce.number().int().min(0).max(100).default(5),
  expiryDate: z.string().optional().default(''),
});
