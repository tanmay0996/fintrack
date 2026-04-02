import { Router } from "express";
import {
  getAllRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
} from "../controllers/record.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(verifyJWT);

/**
 * @swagger
 * /api/v1/records:
 *   get:
 *     tags: [Records]
 *     summary: List financial records (all roles)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [INCOME, EXPENSE] }
 *       - in: query
 *         name: category
 *         schema: { type: string, example: Salary }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date, example: "2026-01-01" }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date, example: "2026-12-31" }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, enum: [date, amount, createdAt, category], default: date }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200: { description: Paginated list of financial records }
 *       401: { description: Unauthorized }
 *   post:
 *     tags: [Records]
 *     summary: Create a financial record (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:   { type: number, example: 85000 }
 *               type:     { type: string, enum: [INCOME, EXPENSE] }
 *               category: { type: string, example: Salary }
 *               date:     { type: string, format: date, example: "2026-01-01" }
 *               notes:    { type: string, example: January salary }
 *     responses:
 *       201: { description: Record created }
 *       400: { description: Validation error }
 *       403: { description: Forbidden }
 */
router.route("/").get(getAllRecords);
router.route("/").post(requireRole("ADMIN"), createRecord);

/**
 * @swagger
 * /api/v1/records/{recordId}:
 *   get:
 *     tags: [Records]
 *     summary: Get a single record by ID (all roles)
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Record data }
 *       404: { description: Record not found }
 *   patch:
 *     tags: [Records]
 *     summary: Update a record (Admin only)
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:   { type: number }
 *               type:     { type: string, enum: [INCOME, EXPENSE] }
 *               category: { type: string }
 *               date:     { type: string, format: date }
 *               notes:    { type: string }
 *     responses:
 *       200: { description: Record updated }
 *       403: { description: Forbidden }
 *       404: { description: Record not found }
 *   delete:
 *     tags: [Records]
 *     summary: Soft-delete a record (Admin only)
 *     parameters:
 *       - in: path
 *         name: recordId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Record soft-deleted (isDeleted set to true) }
 *       403: { description: Forbidden }
 *       404: { description: Record not found }
 */
router
  .route("/:recordId")
  .get(getRecordById)
  .patch(requireRole("ADMIN"), updateRecord)
  .delete(requireRole("ADMIN"), deleteRecord);

export default router;
