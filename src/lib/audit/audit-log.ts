import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

type AuditLogMetadata = Prisma.InputJsonValue;

type AuditLogClient =
  | Pick<Prisma.TransactionClient, "auditLog">
  | typeof prisma;

export type AuditAction =
  | "invitation_code.created"
  | "invitation_code.revoked"
  | "invitation_code.redeemed"
  | "enrollment.approved"
  | "enrollment.rejected"
  | "attendance.opened"
  | "attendance.scanned"
  | "attendance.closed"
  | "attendance.corrected"
  | "module.created"
  | "material.created"
  | "material.published"
  | "material.unpublished"
  | "assignment.created"
  | "assignment.published"
  | "assignment.closed"
  | "submission.created"
  | "submission.superseded"
  | "submission.reopened"
  | "submission.graded"
  | "grade.created"
  | "grade.updated"
  | "project_group.created"
  | "project_group.member_added"
  | "project_group.member_removed"
  | "project_group.active"
  | "project_group.locked"
  | "project_group.archived"
  | "report.exported";

export type AuditEntityType =
  | "invitation_code"
  | "enrollment"
  | "attendance"
  | "session"
  | "module"
  | "material"
  | "assignment"
  | "submission"
  | "project_group"
  | "project_group_member"
  | "report"
  | "grade";

type CreateAuditLogInput = {
  actorUserId: string | null;
  action: AuditAction | string;
  entityType: AuditEntityType | string;
  entityId: string;
  metadata?: AuditLogMetadata;
};

export async function createAuditLog(
  input: CreateAuditLogInput,
  client: AuditLogClient = prisma,
) {
  return client.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? {},
    },
  });
}

export function toAuditMetadata<T extends Record<string, unknown>>(
  metadata: T,
): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(metadata)) as Prisma.InputJsonValue;
}
