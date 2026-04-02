import { prisma } from "../db/index.js";

/**
 * Fire-and-forget audit log writer.
 * Never throws — failures are silently swallowed so they can't break primary operations.
 *
 * @param {object} opts
 * @param {string} opts.action    - LOGIN | LOGOUT | CREATE | UPDATE | DELETE
 * @param {string} opts.resource  - USER | RECORD
 * @param {string} [opts.resourceId]
 * @param {string} [opts.userId]
 * @param {object} [opts.details] - arbitrary JSON payload
 * @param {string} [opts.ipAddress]
 */
export function logAudit({ action, resource, resourceId, userId, details, ipAddress }) {
  prisma.auditLog
    .create({
      data: {
        action,
        resource,
        resourceId: resourceId ?? null,
        userId: userId ?? null,
        details: details ?? undefined,
        ipAddress: ipAddress ?? null,
      },
    })
    .catch(() => {});
}

/** Extract client IP from an Express request object. */
export function getIp(req) {
  return (
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    null
  );
}
