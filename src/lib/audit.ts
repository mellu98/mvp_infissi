import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface AuditEvent {
  companyId: string;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append an audit event. Failures are logged but never thrown — auditing
 * must not block the user's operation.
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        companyId: event.companyId,
        userId: event.userId ?? null,
        userEmail: event.userEmail ?? null,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        metadata: event.metadata ? (event.metadata as Prisma.InputJsonObject) : undefined,
      },
    });
  } catch (err) {
    console.error('[audit] failed to write log:', err);
  }
}
