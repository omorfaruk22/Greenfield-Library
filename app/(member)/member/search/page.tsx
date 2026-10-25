import { Search } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { GlobalSearchResults } from '@/components/global-search-results';
type Props = { searchParams: Promise<{ q?: string | string[] }> };
export default async function MemberSearchPage({ searchParams }: Props) { const params = await searchParams; const raw = params.q; const query = (Array.isArray(raw) ? raw[0] : raw || '').slice(0, 100); return <div className="space-y-5"><SectionHeading title="Search catalog" description="Search the public book catalog by title, ISBN, or description." icon={Search}/><GlobalSearchResults query={query} memberView/></div>; }
