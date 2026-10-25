import { UserRound } from 'lucide-react';
import { SectionHeading } from '@/components/section-heading';
import { MemberProfileForm } from '@/components/member-profile-form';
import { PasswordChangeForm } from '@/components/password-change-form';
export default function MemberProfilePage(){return <div className="space-y-5"><SectionHeading title="My profile" description="Manage your allowed personal details and review your membership status." icon={UserRound}/><MemberProfileForm/><PasswordChangeForm /></div>}
