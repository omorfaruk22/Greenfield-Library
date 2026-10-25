import { Bell } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { NotificationCenter } from '@/components/notification-center';
export default function MemberNotificationsPage(){return <div className="space-y-5"><SectionHeading title="Notifications" description="Borrowing reminders, reservation updates, and account notices." icon={Bell}/><NotificationCenter/></div>}
