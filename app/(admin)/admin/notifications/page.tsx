import { Bell } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { NotificationCenter } from '@/components/notification-center';
export default function NotificationsPage(){return <div className="space-y-5"><SectionHeading title="Notifications" description="Review your account updates and mark messages as read." icon={Bell}/><NotificationCenter/></div>}
