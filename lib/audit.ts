import AuditLog from '@/models/AuditLog';
import type { SafeUser } from '@/types';

export async function writeAuditLog(input: {
  actor: SafeUser; action: string; resourceType: string; resourceId?: string;
  before?: unknown; after?: unknown; requestId?: string; ipAddress?: string;
}) {
  const safeSnapshot = (value: unknown) => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  await AuditLog.create({
    actorUserId: input.actor.id, action: input.action, resourceType: input.resourceType,
    resourceId: input.resourceId || '', before: safeSnapshot(input.before), after: safeSnapshot(input.after),
    requestId: input.requestId || '', ipAddress: input.ipAddress || '',
  });
}
