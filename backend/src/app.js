import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";

import userRouter from "./routes/user.routes.js";
import recordRouter from "./routes/record.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import auditLogRouter from "./routes/auditLog.routes.js";
import { apiLimiter, authLimiter } from "./middleware/rateLimit.middleware.js";
import { swaggerSpec } from "./utils/swagger.js";

const app = express();

// Global middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Rate limiting — applied before routes
app.use("/api/v1", apiLimiter);
app.use("/api/v1/users/login", authLimiter);
app.use("/api/v1/users/refresh-token", authLimiter);

// Swagger UI
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "FinTrack API Docs" }));

// Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/records", recordRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/admin/audit-logs", auditLogRouter);

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    statusCode,
    message,
    errors: err.errors || [],
    success: false,
    data: null,
  });
});

export { app };
