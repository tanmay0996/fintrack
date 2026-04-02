import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FinTrack API",
      version: "1.0.0",
      description:
        "Finance dashboard REST API — manage users, financial records, and analytics with role-based access control.",
    },
    servers: [
      { url: "http://localhost:8000", description: "Local development" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id:        { type: "string", example: "clxyz123" },
            name:      { type: "string", example: "Admin User" },
            email:     { type: "string", example: "admin@fintrack.com" },
            role:      { type: "string", enum: ["VIEWER", "ANALYST", "ADMIN"] },
            isActive:  { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        FinancialRecord: {
          type: "object",
          properties: {
            id:        { type: "string", example: "clxyz456" },
            amount:    { type: "number", example: 85000 },
            type:      { type: "string", enum: ["INCOME", "EXPENSE"] },
            category:  { type: "string", example: "Salary" },
            date:      { type: "string", format: "date-time" },
            notes:     { type: "string", example: "January salary", nullable: true },
            isDeleted: { type: "boolean", example: false },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        ApiResponse: {
          type: "object",
          properties: {
            statusCode: { type: "integer", example: 200 },
            data:       { type: "object" },
            message:    { type: "string", example: "Success" },
            success:    { type: "boolean", example: true },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            statusCode: { type: "integer", example: 400 },
            message:    { type: "string", example: "Validation failed" },
            success:    { type: "boolean", example: false },
            errors:     { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Auth",      description: "Authentication — login, logout, token refresh" },
      { name: "Users",     description: "User management (Admin only)" },
      { name: "Records",   description: "Financial records CRUD" },
      { name: "Dashboard", description: "Analytics and summary data" },
      { name: "Admin",     description: "Admin-only endpoints — audit logs" },
    ],
  },
  apis: ["./src/routes/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
