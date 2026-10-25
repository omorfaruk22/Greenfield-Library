import Notification from '@/models/Notification';

export async function notifyUser(input: { userId: string; type: string; title: string; message: string; targetUrl?: string; deduplicationKey?: string }) {
  try {
    await Notification.create({ recipientUserId: input.userId, type: input.type, title: input.title, message: input.message, targetUrl: input.targetUrl || '', deduplicationKey: input.deduplicationKey || undefined });
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 11000)) throw error;
  }
}
