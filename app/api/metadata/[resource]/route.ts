import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize, STAFF_ROLES } from '@/lib/permissions';
import { getMetadataModel } from '@/lib/metadata-models';
import { parseMetadata } from '@/lib/metadata-validation';
import { isDuplicateKey, readJson, serverError } from '@/lib/http';
import { getPagination } from '@/lib/utils';
import { writeAuditLog } from '@/lib/audit';

type Context = { params: Promise<{ resource: string }> };
export const runtime = 'nodejs';
export async function GET(request: NextRequest, context: Context) {
  try {
    const { resource } = await context.params;
    const model = getMetadataModel(resource);
    if (!model) return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
    await connectDB();
    const url = new URL(request.url); const { page, pageSize, skip } = getPagination(url);
    const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
    const filter = q ? { $or: [{ name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }, { slug: { $regex: q, $options: 'i' } }] } : {};
    const [items, total] = await Promise.all([model.find(filter).sort({ name: 1 }).skip(skip).limit(pageSize).lean(), model.countDocuments(filter)]);
    return NextResponse.json({ items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) { return serverError('metadata/list', error); }
}
export async function POST(request: Request, context: Context) {
  const access = await authorize(STAFF_ROLES); if (access.response) return access.response;
  try {
    const { resource } = await context.params; const model = getMetadataModel(resource);
    if (!model) return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
    const body = await readJson(request); const parsed = parseMetadata(resource, body);
    if (!parsed.success) return NextResponse.json({ error: parsed.message, details: parsed.details }, { status: 422 });
    await connectDB();
    const item = await model.create(parsed.data as never);
    await writeAuditLog({ actor: access.user, action: `${resource.slice(0, -1)}.created`, resourceType: resource, resourceId: String((item as { _id: unknown })._id), after: parsed.data });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (isDuplicateKey(error)) return NextResponse.json({ error: 'A record with this name or identifier already exists.' }, { status: 409 });
    return serverError('metadata/create', error);
  }
}
