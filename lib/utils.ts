import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDate(value?: string | Date | null, locale = 'en-GB'): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}
export function formatMoney(value: number, currency = process.env.LIBRARY_CURRENCY || 'BDT'): string {
  return new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value || 0);
}
export function toSlug(value: string): string {
  return value.toLowerCase().trim().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'book';
}
export function getPagination(url: URL, defaultPageSize = 10) {
  const page = Math.max(1, Math.floor(Number(url.searchParams.get('page')) || 1));
  const pageSize = Math.min(100, Math.max(5, Math.floor(Number(url.searchParams.get('pageSize')) || defaultPageSize)));
  return { page, pageSize, skip: (page - 1) * pageSize };
}
export function isValidObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test(value);
}
export function getRemainingFine(assessedAmount: number, paidAmount: number): number {
  return Math.max(0, Math.round((assessedAmount - paidAmount) * 100) / 100);
}
export function calculateOverdueDays(dueAt: Date, endAt: Date, graceDays = 0, timezone = 'Asia/Dhaka'): number {
  const asCalendarDay = (date: Date) => {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return Math.floor(Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day)) / 86400000);
  };
  return Math.max(0, asCalendarDay(endAt) - asCalendarDay(dueAt) - Math.max(0, graceDays));
}
