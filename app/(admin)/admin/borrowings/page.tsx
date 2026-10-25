import { ArrowLeftRight } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { CirculationManager } from '@/components/circulation-manager';
export default function BorrowingsPage(){return <div className="space-y-5"><SectionHeading title="Borrowing desk" description="Issue books, review active loans, renew eligible loans, and monitor due dates." icon={ArrowLeftRight}/><CirculationManager mode="issue"/></div>}
