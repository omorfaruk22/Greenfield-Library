import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Settings } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { SettingsForm } from '@/components/settings-form';
export default async function SettingsPage(){const user=await getCurrentUser();if(user?.role!=='Admin')redirect('/admin/dashboard');return <div className="space-y-5"><SectionHeading title="Library settings" description="Configure borrowing limits, fine rates, registration, and core library information." icon={Settings}/><SettingsForm/></div>}
