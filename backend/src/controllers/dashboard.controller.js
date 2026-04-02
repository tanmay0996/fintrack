import { prisma } from "../db/index.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.date = {};
    if (startDate) dateFilter.date.gte = new Date(startDate);
    if (endDate) dateFilter.date.lte = new Date(endDate);
  }

  // Total income
  const incomeAgg = await prisma.financialRecord.aggregate({
    where: { type: "INCOME", ...dateFilter },
    _sum: { amount: true },
    _count: true,
  });

  // Total expenses
  const expenseAgg = await prisma.financialRecord.aggregate({
    where: { type: "EXPENSE", ...dateFilter },
    _sum: { amount: true },
    _count: true,
  });

  const totalIncome = incomeAgg._sum.amount || 0;
  const totalExpenses = expenseAgg._sum.amount || 0;
  const netBalance = totalIncome - totalExpenses;

  // Category-wise totals
  const categoryTotals = await prisma.financialRecord.groupBy({
    by: ["category", "type"],
    where: dateFilter,
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: "desc" } },
  });

  // Recent activity (last 10 records)
  const recentActivity = await prisma.financialRecord.findMany({
    where: dateFilter,
    take: 10,
    orderBy: { date: "desc" },
    include: { createdBy: { select: { name: true } } },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalIncome,
        totalExpenses,
        netBalance,
        incomeCount: incomeAgg._count,
        expenseCount: expenseAgg._count,
        categoryTotals,
        recentActivity,
      },
      "Dashboard summary fetched successfully"
    )
  );
});

const getMonthlyTrends = asyncHandler(async (req, res) => {
  const { year } = req.query;
  const targetYear = Number(year) || new Date().getFullYear();

  const startOfYear = new Date(`${targetYear}-01-01`);
  const endOfYear = new Date(`${targetYear}-12-31T23:59:59`);

  const records = await prisma.financialRecord.findMany({
    where: { date: { gte: startOfYear, lte: endOfYear } },
    select: { amount: true, type: true, date: true },
    orderBy: { date: "asc" },
  });

  // Group by month
  const monthlyMap = {};
  for (let m = 1; m <= 12; m++) {
    const key = String(m).padStart(2, "0");
    monthlyMap[key] = { month: key, income: 0, expenses: 0, net: 0 };
  }

  for (const record of records) {
    const month = String(record.date.getMonth() + 1).padStart(2, "0");
    if (record.type === "INCOME") {
      monthlyMap[month].income += record.amount;
    } else {
      monthlyMap[month].expenses += record.amount;
    }
    monthlyMap[month].net = monthlyMap[month].income - monthlyMap[month].expenses;
  }

  const trends = Object.values(monthlyMap);

  return res.status(200).json(new ApiResponse(200, { year: targetYear, trends }, "Monthly trends fetched successfully"));
});

const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const { type, startDate, endDate } = req.query;

  const where = {};
  if (type) where.type = type;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const breakdown = await prisma.financialRecord.groupBy({
    by: ["category"],
    where,
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: "desc" } },
  });

  return res.status(200).json(
    new ApiResponse(200, breakdown, "Category breakdown fetched successfully")
  );
});

export { getSummary, getMonthlyTrends, getCategoryBreakdown };
