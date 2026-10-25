import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export async function readJson(request: Request): Promise<unknown> {
  try { return await request.json(); } catch { throw new Error('INVALID_JSON'); }
}
export function validationError(error: unknown) {
  if (error instanceof ZodError) return NextResponse.json({ error: 'Please review the submitted fields.', details: error.flatten().fieldErrors }, { status: 422 });
  return null;
}
export function serverError(label: string, error: unknown) {
  console.error(`[${label}]`, error instanceof Error ? error.message : 'Unknown error');
  const message = error instanceof Error && error.message === 'MONGODB_URI is missing. Add it to your local .env.local file.'
    ? error.message
    : 'An unexpected server error occurred. Please try again.';
  return NextResponse.json({ error: message }, { status: 500 });
}
export function isDuplicateKey(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'code' in error && (error as { code?: number }).code === 11000;
}
