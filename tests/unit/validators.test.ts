import { describe, expect, it } from 'vitest';
import { loginSchema, passwordChangeSchema, registerSchema } from '../../lib/validators/auth';
import { bookSchema } from '../../lib/validators/book';
import { paymentSchema, reservationSchema } from '../../lib/validators/operations';

const validId = '507f1f77bcf86cd799439011';

describe('server input schemas', () => {
  it('normalizes login email and applies the secure default for remember-me', () => {
    const result = loginSchema.parse({ email: '  PERSON@EXAMPLE.COM ', password: 'secret' });
    expect(result.email).toBe('person@example.com');
    expect(result.remember).toBe(false);
  });

  it('does not allow a public registrant to select a privileged role', () => {
    const result = registerSchema.parse({ name: 'Reader One', email: 'reader@example.com', password: 'strong-password', role: 'Admin' });
    expect(result).not.toHaveProperty('role');
  });

  it('rejects a password change when confirmation does not match', () => {
    const result = passwordChangeSchema.safeParse({ currentPassword: 'old-password', newPassword: 'new-password-one', confirmPassword: 'different-password' });
    expect(result.success).toBe(false);
  });

  it('rejects an inventory quantity that exceeds the physical total', () => {
    const result = bookSchema.safeParse({ title: 'Example Book', authorIds: [validId], categoryId: validId, publisherId: '', coverImageUrl: '', totalCopies: 2, availableCopies: 3, language: 'English' });
    expect(result.success).toBe(false);
  });

  it('rejects malformed reservation IDs', () => {
    expect(reservationSchema.safeParse({ bookId: 'not-an-object-id' }).success).toBe(false);
  });

  it('requires positive fine payments', () => {
    expect(paymentSchema.safeParse({ fineId: validId, amount: 0 }).success).toBe(false);
    expect(paymentSchema.safeParse({ fineId: validId, amount: 25, paymentMethod: 'Cash' }).success).toBe(true);
  });
});
