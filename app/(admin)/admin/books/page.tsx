import { BooksManager } from '@/components/books-manager';
import { SectionHeading } from '@/components/section-heading';
import { BookOpen } from 'lucide-react';
export default function BooksPage(){return <div className="space-y-5"><SectionHeading title="Book collection" description="Manage bibliographic records, physical copies, and shelf locations across your library." icon={BookOpen}/><BooksManager/></div>}
