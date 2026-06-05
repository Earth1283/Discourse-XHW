import "server-only";
import { desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../client";
import { auditLog } from "../schema";
import type { AuditEntry } from "../schema";

export type AuditAction =
  | "soft_delete_post"
  | "hard_purge_post"
  | "ban_poster"
  | "lift_ban"
  | "resolve_report"
  | "lock_thread"
  | "unlock_thread"
  | "pin_thread"
  | "unpin_thread"
  | "archive_thread"
  | "create_board"
  | "update_board"
  | "delete_board";

export type AuditTargetType = "post" | "thread" | "ban" | "board" | "report";

export function logAdminAction(entry: {
  adminHandle: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  detail?: string;
}): void {
  db.insert(auditLog)
    .values({ id: nanoid(10), ...entry, createdAt: Date.now() })
    .run();
}

export function listAuditLog(limit = 100): AuditEntry[] {
  return db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(limit).all();
}
