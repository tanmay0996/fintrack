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

// All record routes require authentication
router.use(verifyJWT);

// Viewer, Analyst, Admin can read
router.route("/").get(getAllRecords);
router.route("/:recordId").get(getRecordById);

// Admin only: create, update, delete
router.route("/").post(requireRole("ADMIN"), createRecord);
router.route("/:recordId").patch(requireRole("ADMIN"), updateRecord).delete(requireRole("ADMIN"), deleteRecord);

export default router;
