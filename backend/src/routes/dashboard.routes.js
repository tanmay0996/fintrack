import { Router } from "express";
import { getSummary, getMonthlyTrends, getCategoryBreakdown } from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// All authenticated users can view the dashboard
router.use(verifyJWT);

router.route("/summary").get(getSummary);
router.route("/trends").get(getMonthlyTrends);
router.route("/categories").get(getCategoryBreakdown);

export default router;
