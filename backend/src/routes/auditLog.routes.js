import { Router } from "express";
import { getAuditLogs } from "../controllers/auditLog.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(verifyJWT, requireRole("ADMIN"));

/**
 * @swagger
 * /api/v1/admin/audit-logs:
 *   get:
 *     tags: [Admin]
 *     summary: Get paginated audit logs (Admin only)
 *     description: Returns all system audit events — logins, logouts, creates, updates, and deletes.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: action
 *         schema: { type: string, enum: [LOGIN, LOGOUT, CREATE, UPDATE, DELETE] }
 *       - in: query
 *         name: resource
 *         schema: { type: string, enum: [USER, RECORD] }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date, example: "2026-01-01" }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date, example: "2026-12-31" }
 *     responses:
 *       200:
 *         description: Paginated audit logs
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         logs:       { type: array, items: { type: object } }
 *                         total:      { type: integer }
 *                         page:       { type: integer }
 *                         limit:      { type: integer }
 *                         totalPages: { type: integer }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden — Admin only }
 */
router.route("/").get(getAuditLogs);

export default router;
