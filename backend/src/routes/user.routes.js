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

// ─── Public routes ────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/users/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, example: admin@fintrack.com }
 *               password: { type: string, example: Admin@123 }
 *     responses:
 *       200:
 *         description: Login successful — returns user object and access token
 *       401: { description: Invalid credentials }
 *       404: { description: User not found }
 *       429: { description: Too many login attempts }
 */
router.route("/login").post(loginUser);

/**
 * @swagger
 * /api/v1/users/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate access token using refresh token
 *     security: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: New access token issued }
 *       401: { description: Invalid or expired refresh token }
 */
router.route("/refresh-token").post(refreshAccessToken);

// ─── Secured routes ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/users/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and invalidate tokens
 *     responses:
 *       200: { description: Logged out successfully }
 *       401: { description: Unauthorized }
 */
router.route("/logout").post(verifyJWT, logoutUser);

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401: { description: Unauthorized }
 */
router.route("/me").get(verifyJWT, getCurrentUser);

// ─── Admin-only routes ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users (Admin only)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [VIEWER, ANALYST, ADMIN] }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200: { description: Paginated list of users }
 *       403: { description: Forbidden }
 *   post:
 *     tags: [Users]
 *     summary: Create a new user (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:     { type: string, example: Jane Doe }
 *               email:    { type: string, example: jane@example.com }
 *               password: { type: string, example: Secret@123 }
 *               role:     { type: string, enum: [VIEWER, ANALYST, ADMIN], default: VIEWER }
 *     responses:
 *       201: { description: User created }
 *       409: { description: Email already in use }
 */
router
  .route("/")
  .get(verifyJWT, requireRole("ADMIN"), getAllUsers)
  .post(verifyJWT, requireRole("ADMIN"), createUser);

/**
 * @swagger
 * /api/v1/users/{userId}:
 *   patch:
 *     tags: [Users]
 *     summary: Update user role or status (Admin only)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:     { type: string, enum: [VIEWER, ANALYST, ADMIN] }
 *               isActive: { type: boolean }
 *               name:     { type: string }
 *     responses:
 *       200: { description: User updated }
 *       404: { description: User not found }
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user (Admin only)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User deleted }
 *       404: { description: User not found }
 */
router
  .route("/:userId")
  .patch(verifyJWT, requireRole("ADMIN"), updateUser)
  .delete(verifyJWT, requireRole("ADMIN"), deleteUser);

export default router;
