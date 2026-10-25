import { BookOpen } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { MemberCatalog } from '@/components/member-catalog';
export default function CatalogPage(){return <div className="space-y-5"><SectionHeading title="Explore the catalog" description="Find books by title and ISBN. Availability is refreshed from the library database." icon={BookOpen}/><MemberCatalog/></div>}
