import { FileBarChart } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { ReportCenter } from '@/components/report-center';
export default function ReportsPage(){return <div className="space-y-5"><SectionHeading title="Reports & analytics" description="Use live MongoDB records to review inventory, circulation, membership, and financial activity." icon={FileBarChart}/><ReportCenter/></div>}
