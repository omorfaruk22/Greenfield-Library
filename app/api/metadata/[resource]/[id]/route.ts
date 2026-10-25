import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { authorize, STAFF_ROLES } from '@/lib/permissions';
import { getMetadataModel } from '@/lib/metadata-models';
import { parseMetadata } from '@/lib/metadata-validation';
import { isDuplicateKey, readJson, serverError } from '@/lib/http';
import { isValidObjectId } from '@/lib/utils';
import { writeAuditLog } from '@/lib/audit';
import Book from '@/models/Book';

type Context = { params: Promise<{ resource: string; id: string }> };
export const runtime = 'nodejs';
export async function PATCH(request: Request, context: Context) {
  const access = await authorize(STAFF_ROLES); if (access.response) return access.response;
  try {
    const { resource, id } = await context.params; const model = getMetadataModel(resource);
    if (!model) return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
    const body = await readJson(request); const parsed = parseMetadata(resource, body, true);
    if (!parsed.success) return NextResponse.json({ error: parsed.message, details: parsed.details }, { status: 422 });
    await connectDB();
    const before = await model.findById(id).lean();
    if (!before) return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
    const item = await model.findByIdAndUpdate(id, { $set: parsed.data }, { new: true, runValidators: true });
    await writeAuditLog({ actor: access.user, action: `${resource.slice(0, -1)}.updated`, resourceType: resource, resourceId: id, before, after: parsed.data });
    return NextResponse.json({ item });
  } catch (error) {
    if (isDuplicateKey(error)) return NextResponse.json({ error: 'A record with this name or identifier already exists.' }, { status: 409 });
    return serverError('metadata/update', error);
  }
}
export async function DELETE(_request: Request, context: Context) {
  const access = await authorize(['Admin']); if (access.response) return access.response;
  try {
    const { resource, id } = await context.params; const model = getMetadataModel(resource);
    if (!model) return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
    if (!isValidObjectId(id)) return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
    await connectDB();
    const dependencyFilter = resource === 'categories' ? { categoryId: id, archivedAt: null } : resource === 'authors' ? { authorIds: id, archivedAt: null } : { publisherId: id, archivedAt: null };
    const dependencyCount = await Book.countDocuments(dependencyFilter);
    if (dependencyCount > 0) return NextResponse.json({ error: `This record is used by ${dependencyCount} active book(s). Reassign the books before deletion.` }, { status: 409 });
    const item = await model.findByIdAndDelete(id);
    if (!item) return NextResponse.json({ error: 'Record not found.' }, { status: 404 });
    await writeAuditLog({ actor: access.user, action: `${resource.slice(0, -1)}.deleted`, resourceType: resource, resourceId: id });
    return NextResponse.json({ success: true });
  } catch (error) { return serverError('metadata/delete', error); }
}
