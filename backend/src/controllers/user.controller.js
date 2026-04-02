import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logAudit, getIp } from "../utils/auditLogger.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
  const refreshToken = jwt.sign({ id: userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
  return { accessToken, refreshToken };
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if ([email, password].some((f) => !f?.trim())) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new ApiError(404, "User not found");
  if (!user.isActive) throw new ApiError(403, "Account is deactivated");

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  const { accessToken, refreshToken } = generateTokens(user.id);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  logAudit({
    action: "LOGIN",
    resource: "USER",
    resourceId: user.id,
    userId: user.id,
    details: { email: user.email, role: user.role },
    ipAddress: getIp(req),
  });

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, { user: safeUser, accessToken }, "Logged in successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { refreshToken: null },
  });

  logAudit({
    action: "LOGOUT",
    resource: "USER",
    resourceId: req.user.id,
    userId: req.user.id,
    ipAddress: getIp(req),
  });

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request");

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is invalid or has been used");
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);
  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", newRefreshToken, cookieOptions)
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched"));
});

// Admin: list all users
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, isActive, search } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive === "true";
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { users, total, page: Number(page), limit: Number(limit) }, "Users fetched successfully")
  );
});

// Admin: create a user
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if ([name, email, password].some((f) => !f?.trim())) {
    throw new ApiError(400, "Name, email and password are required");
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) throw new ApiError(409, "Email already in use");

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), password: hashedPassword, role: role || "VIEWER" },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
  });

  logAudit({
    action: "CREATE",
    resource: "USER",
    resourceId: user.id,
    userId: req.user.id,
    details: { name: user.name, email: user.email, role: user.role },
    ipAddress: getIp(req),
  });

  return res.status(201).json(new ApiResponse(201, user, "User created successfully"));
});

// Admin: update user role / status
const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role, isActive, name } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  // Prevent admin from deactivating themselves
  if (userId === req.user.id && isActive === false) {
    throw new ApiError(400, "You cannot deactivate your own account");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
      ...(name && { name }),
    },
    select: { id: true, name: true, email: true, role: true, isActive: true, updatedAt: true },
  });

  logAudit({
    action: "UPDATE",
    resource: "USER",
    resourceId: userId,
    userId: req.user.id,
    details: {
      ...(role && { role }),
      ...(isActive !== undefined && { isActive }),
      ...(name && { name }),
    },
    ipAddress: getIp(req),
  });

  return res.status(200).json(new ApiResponse(200, updated, "User updated successfully"));
});

// Admin: delete user
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (userId === req.user.id) throw new ApiError(400, "You cannot delete your own account");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");

  await prisma.user.delete({ where: { id: userId } });

  logAudit({
    action: "DELETE",
    resource: "USER",
    resourceId: userId,
    userId: req.user.id,
    details: { email: user.email, name: user.name },
    ipAddress: getIp(req),
  });

  return res.status(200).json(new ApiResponse(200, {}, "User deleted successfully"));
});

export {
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
};
