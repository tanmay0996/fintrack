import rateLimit from "express-rate-limit";

// Strict limit for auth endpoints — 10 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: "Too many login attempts. Please try again after 15 minutes.",
    success: false,
    data: null,
  },
});

// General limit for all API routes — 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    statusCode: 429,
    message: "Too many requests. Please slow down.",
    success: false,
    data: null,
  },
});
