import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';
export const runtime = 'nodejs';
export async function POST() {
  try { await destroySession(); return NextResponse.json({ success: true }); }
  catch { return NextResponse.json({ error: 'Unable to sign out. Please try again.' }, { status: 500 }); }
}
