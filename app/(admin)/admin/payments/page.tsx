import { CreditCard } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { PaymentManager } from '@/components/payment-manager';
export default function PaymentsPage(){return <div className="space-y-5"><SectionHeading title="Fine payments" description="Record full or partial fine payments and keep an accurate, auditable receipt ledger." icon={CreditCard}/><PaymentManager/></div>}
