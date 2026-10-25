import { describe, expect, it } from 'vitest';
import { calculateOverdueDays, getRemainingFine, getPagination, isValidObjectId, toSlug } from '../../lib/utils';

describe('library utilities', () => {
  it('calculates overdue calendar days in the library timezone', () => {
    expect(calculateOverdueDays(new Date('2025-01-01T00:00:00+06:00'), new Date('2025-01-05T00:00:00+06:00'), 0, 'Asia/Dhaka')).toBe(4);
  });
  it('applies grace days without creating negative overdue days', () => {
    expect(calculateOverdueDays(new Date('2025-01-01T00:00:00+06:00'), new Date('2025-01-05T00:00:00+06:00'), 2, 'Asia/Dhaka')).toBe(2);
    expect(calculateOverdueDays(new Date('2025-01-05T00:00:00+06:00'), new Date('2025-01-01T00:00:00+06:00'), 0, 'Asia/Dhaka')).toBe(0);
  });
  it('keeps fine balances non-negative and rounded to two decimal places', () => {
    expect(getRemainingFine(25, 10)).toBe(15);
    expect(getRemainingFine(25, 35)).toBe(0);
    expect(getRemainingFine(10, 2.345)).toBe(7.66);
  });
  it('normalizes a title into a URL-safe slug', () => {
    expect(toSlug('Practical Web Engineering')).toBe('practical-web-engineering');
    expect(toSlug('   ')).toBe('book');
  });
  it('validates Mongo ObjectId strings', () => {
    expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
    expect(isValidObjectId('invalid')).toBe(false);
  });
  it('clamps pagination size to the supported maximum', () => {
    const url = new URL('http://localhost/api/books?page=3&pageSize=1000');
    expect(getPagination(url)).toEqual({ page: 3, pageSize: 100, skip: 200 });
  });
});
