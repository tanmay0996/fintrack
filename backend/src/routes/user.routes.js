import { Router } from "express";
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Public routes
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);

// Admin-only routes
router
  .route("/")
  .get(verifyJWT, requireRole("ADMIN"), getAllUsers)
  .post(verifyJWT, requireRole("ADMIN"), createUser);

router
  .route("/:userId")
  .patch(verifyJWT, requireRole("ADMIN"), updateUser)
  .delete(verifyJWT, requireRole("ADMIN"), deleteUser);

export default router;
