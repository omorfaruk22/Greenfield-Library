import { BookMarked } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { MemberLoans } from '@/components/member-loans';
export default function MyBooksPage(){return <div className="space-y-5"><SectionHeading title="My borrowed books" description="Track due dates, renew eligible loans, and review returned books." icon={BookMarked}/><MemberLoans/></div>}
