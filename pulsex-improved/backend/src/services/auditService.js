import { db, id, persist } from "../db/store.js";

/**
 * Writes an immutable audit log entry. Entries are never updated or deleted —
 * only appended — which is what "immutable audit log" means in a real
 * write-once-read-many (WORM) storage backend.
 */
export function writeAudit({ actorUserId, actorRole, patientId, ip, gps, action, infoViewed, reason }) {
  const entry = {
    id: id(),
    actorUserId,
    actorRole,
    patientId,
    ip: ip || "unknown",
    gps: gps || null,
    action,
    infoViewed: infoViewed || [],
    reason: reason || "",
    timestamp: new Date().toISOString(),
  };
  db().auditLogs.push(entry);
  persist();
  return entry;
}

export function notify(userId, type, message) {
  const n = {
    id: id(),
    userId,
    type,
    message,
    read: false,
    createdAt: new Date().toISOString(),
  };
  db().notifications.push(n);
  persist();
  return n;
}
