import { BookMarked } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { CirculationManager } from '@/components/circulation-manager';
export default function ReturnsPage(){return <div className="space-y-5"><SectionHeading title="Book returns" description="Check in borrowed books. Inventory and overdue fines are updated by the server." icon={BookMarked}/><CirculationManager mode="return"/></div>}
