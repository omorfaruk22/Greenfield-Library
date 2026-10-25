import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Activity } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { ResourceManager } from '@/components/resource-manager';
export default async function AuditLogsPage(){const user=await getCurrentUser();if(user?.role!=='Admin')redirect('/admin/dashboard');return <div className="space-y-5"><SectionHeading title="Audit trail" description="A read-only history of important library operations and administrative changes." icon={Activity}/><ResourceManager title="Audit records" singular="Audit record" endpoint="/api/audit-logs" canCreate={false} canEdit={false} canDelete={false} fields={[]} columns={[{key:'actorUserId',label:'Actor',render:item=>String((item.actorUserId as {name?:string;email?:string})?.name||(item.actorUserId as {email?:string})?.email||'System')},{key:'action',label:'Action'},{key:'resourceType',label:'Resource'},{key:'resourceId',label:'Resource ID'},{key:'createdAt',label:'Timestamp'}]}/></div>}
