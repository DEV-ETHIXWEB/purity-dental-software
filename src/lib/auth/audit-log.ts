import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Write an AuditLog row for a security- or data-relevant action. Call this
 * from every Server Action that mutates data, after the mutation succeeds
 * (see `src/lib/actions/mark-invoice-paid.ts` / `register-patient.ts` for
 * the pattern). Failure to write an audit row should not fail the parent
 * mutation — logging is best-effort observability, not a transactional
 * guarantee — so callers should not let an audit-log error mask a
 * successful mutation's result.
 */
export interface AuditLogInput {
  organizationId: string;
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Prisma.InputJsonValue;
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        metadata: input.metadata,
      },
    });
  } catch (error) {
    // Never let audit logging failure (e.g. DB not reachable yet in this
    // phase of the project) mask or throw over a successful mutation.
    console.error("Failed to write audit log", {
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      error,
    });
  }
}
