import Member from '@/models/Member';
import type { SafeUser } from '@/types';

export async function getMemberForUser(user: SafeUser) {
  return Member.findOne({ userId: user.id });
}
