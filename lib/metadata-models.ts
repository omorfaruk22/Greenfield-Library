import type { Model } from 'mongoose';
import Author from '@/models/Author';
import Category from '@/models/Category';
import Publisher from '@/models/Publisher';

export type MetadataResource = 'authors' | 'categories' | 'publishers';
export function getMetadataModel(resource: string): Model<unknown> | null {
  switch (resource) {
    case 'authors': return Author as unknown as Model<unknown>;
    case 'categories': return Category as unknown as Model<unknown>;
    case 'publishers': return Publisher as unknown as Model<unknown>;
    default: return null;
  }
}
export function metadataResourceTitle(resource: MetadataResource): string {
  return resource[0].toUpperCase() + resource.slice(1, -1);
}
