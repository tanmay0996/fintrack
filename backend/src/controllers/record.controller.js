import { prisma } from "../db/index.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Base filter — always exclude soft-deleted records
const ACTIVE = { isDeleted: false };

const getAllRecords = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    type,
    category,
    startDate,
    endDate,
    search,
    sortBy = "date",
    sortOrder = "desc",
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const where = { ...ACTIVE };
  if (type) where.type = type;
  if (category) where.category = category;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (search) {
    where.OR = [
      { category: { contains: search, mode: "insensitive" } },
      { notes: { contains: search, mode: "insensitive" } },
    ];
  }

  const allowedSortFields = ["date", "amount", "createdAt", "category"];
  const orderByField = allowedSortFields.includes(sortBy) ? sortBy : "date";

  const [records, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { [orderByField]: sortOrder === "asc" ? "asc" : "desc" },
      include: { createdBy: { select: { id: true, name: true, email: true } } },
    }),
    prisma.financialRecord.count({ where }),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      { records, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
      "Records fetched successfully"
    )
  );
});

const getRecordById = asyncHandler(async (req, res) => {
  const { recordId } = req.params;

  const record = await prisma.financialRecord.findFirst({
    where: { id: recordId, ...ACTIVE },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });
  if (!record) throw new ApiError(404, "Record not found");

  return res.status(200).json(new ApiResponse(200, record, "Record fetched successfully"));
});

const createRecord = asyncHandler(async (req, res) => {
  const { amount, type, category, date, notes } = req.body;

  if ([amount, type, category, date].some((f) => f === undefined || f === null || f === "")) {
    throw new ApiError(400, "Amount, type, category and date are required");
  }
  if (!["INCOME", "EXPENSE"].includes(type)) {
    throw new ApiError(400, "Type must be INCOME or EXPENSE");
  }
  if (Number(amount) <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }

  const record = await prisma.financialRecord.create({
    data: {
      amount: Number(amount),
      type,
      category,
      date: new Date(date),
      notes: notes || null,
      createdById: req.user.id,
    },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });

  return res.status(201).json(new ApiResponse(201, record, "Record created successfully"));
});

const updateRecord = asyncHandler(async (req, res) => {
  const { recordId } = req.params;
  const { amount, type, category, date, notes } = req.body;

  const record = await prisma.financialRecord.findFirst({ where: { id: recordId, ...ACTIVE } });
  if (!record) throw new ApiError(404, "Record not found");

  if (type && !["INCOME", "EXPENSE"].includes(type)) {
    throw new ApiError(400, "Type must be INCOME or EXPENSE");
  }
  if (amount !== undefined && Number(amount) <= 0) {
    throw new ApiError(400, "Amount must be greater than 0");
  }

  const updated = await prisma.financialRecord.update({
    where: { id: recordId },
    data: {
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(type && { type }),
      ...(category && { category }),
      ...(date && { date: new Date(date) }),
      ...(notes !== undefined && { notes: notes || null }),
    },
    include: { createdBy: { select: { id: true, name: true, email: true } } },
  });

  return res.status(200).json(new ApiResponse(200, updated, "Record updated successfully"));
});

// Soft delete — sets isDeleted=true and records deletedAt timestamp
const deleteRecord = asyncHandler(async (req, res) => {
  const { recordId } = req.params;

  const record = await prisma.financialRecord.findFirst({ where: { id: recordId, ...ACTIVE } });
  if (!record) throw new ApiError(404, "Record not found");

  await prisma.financialRecord.update({
    where: { id: recordId },
    data: { isDeleted: true, deletedAt: new Date() },
  });

  return res.status(200).json(new ApiResponse(200, {}, "Record deleted successfully"));
});

export { getAllRecords, getRecordById, createRecord, updateRecord, deleteRecord };
