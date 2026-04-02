import { prisma } from "../db/index.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAuditLogs = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    action,
    resource,
    userId,
    startDate,
    endDate,
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const where = {};
  if (action) where.action = action.toUpperCase();
  if (resource) where.resource = resource.toUpperCase();
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { logs, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
      "Audit logs fetched successfully"
    )
  );
});

export { getAuditLogs };
