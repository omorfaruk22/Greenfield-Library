import { authorSchema, categorySchema, publisherSchema } from '@/lib/validators/operations';
import { toSlug } from '@/lib/utils';

export function parseMetadata(resource: string, body: unknown, partial = false): { success: true; data: Record<string, unknown> } | { success: false; message: string; details?: unknown } {
  const schema = resource === 'authors' ? authorSchema : resource === 'categories' ? categorySchema : resource === 'publishers' ? publisherSchema : null;
  if (!schema) return { success: false, message: 'Unknown metadata type.' };
  const result = (partial ? schema.partial() : schema).safeParse(body);
  if (!result.success) return { success: false, message: 'Please review the submitted fields.', details: result.error.flatten().fieldErrors };
  const data = result.data as Record<string, unknown>;
  if (resource === 'categories' && typeof data.name === 'string' && !data.slug) data.slug = toSlug(data.name);
  if (resource === 'categories' && typeof data.slug === 'string') data.slug = toSlug(data.slug);
  if (resource === 'authors' && typeof data.birthDate === 'string') data.birthDate = data.birthDate ? new Date(data.birthDate) : undefined;
  return { success: true, data };
}
