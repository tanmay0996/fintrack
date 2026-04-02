import { Router } from "express";
import { getSummary, getMonthlyTrends, getCategoryBreakdown } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

/**
 * @swagger
 * /api/v1/dashboard/summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get financial summary (all roles)
 *     description: Returns total income, expenses, net balance, category totals, and recent activity.
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date, example: "2026-01-01" }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date, example: "2026-12-31" }
 *     responses:
 *       200:
 *         description: Dashboard summary data
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
 *                         totalIncome:    { type: number }
 *                         totalExpenses:  { type: number }
 *                         netBalance:     { type: number }
 *                         incomeCount:    { type: integer }
 *                         expenseCount:   { type: integer }
 *                         categoryTotals: { type: array, items: { type: object } }
 *                         recentActivity: { type: array, items: { type: object } }
 *       401: { description: Unauthorized }
 */
router.route("/summary").get(getSummary);

/**
 * @swagger
 * /api/v1/dashboard/trends:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get monthly income and expense trends (all roles)
 *     parameters:
 *       - in: query
 *         name: year
 *         schema: { type: integer, example: 2026 }
 *     responses:
 *       200:
 *         description: Monthly breakdown for the given year (12 entries)
 *       401: { description: Unauthorized }
 */
router.route("/trends").get(getMonthlyTrends);

/**
 * @swagger
 * /api/v1/dashboard/categories:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get category-level spending breakdown (all roles)
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [INCOME, EXPENSE] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Category totals sorted by amount }
 *       401: { description: Unauthorized }
 */
router.route("/categories").get(getCategoryBreakdown);

export default router;
