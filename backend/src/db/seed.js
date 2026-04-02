import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seed = async () => {
  console.log("Seeding database...");

  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const analystPassword = await bcrypt.hash("Analyst@123", 10);
  const viewerPassword = await bcrypt.hash("Viewer@123", 10);

  // Upsert admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@fintrack.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@fintrack.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: "analyst@fintrack.com" },
    update: {},
    create: {
      name: "Analyst User",
      email: "analyst@fintrack.com",
      password: analystPassword,
      role: "ANALYST",
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: "viewer@fintrack.com" },
    update: {},
    create: {
      name: "Viewer User",
      email: "viewer@fintrack.com",
      password: viewerPassword,
      role: "VIEWER",
    },
  });

  console.log(`Admin: ${admin.email}`);
  console.log(`Analyst: ${analyst.email}`);
  console.log(`Viewer: ${viewer.email}`);

  // Seed sample financial records
  const sampleRecords = [
    { amount: 85000, type: "INCOME", category: "Salary", date: new Date("2026-01-01"), notes: "January salary" },
    { amount: 12000, type: "INCOME", category: "Freelance", date: new Date("2026-01-15"), notes: "Web project" },
    { amount: 3500, type: "EXPENSE", category: "Housing", date: new Date("2026-01-05"), notes: "Rent" },
    { amount: 800, type: "EXPENSE", category: "Food", date: new Date("2026-01-10"), notes: "Groceries" },
    { amount: 1200, type: "EXPENSE", category: "Transport", date: new Date("2026-01-12"), notes: "Monthly pass + fuel" },
    { amount: 85000, type: "INCOME", category: "Salary", date: new Date("2026-02-01"), notes: "February salary" },
    { amount: 5000, type: "INCOME", category: "Investment", date: new Date("2026-02-14"), notes: "Dividend payout" },
    { amount: 3500, type: "EXPENSE", category: "Housing", date: new Date("2026-02-05"), notes: "Rent" },
    { amount: 950, type: "EXPENSE", category: "Food", date: new Date("2026-02-08"), notes: "Groceries" },
    { amount: 2200, type: "EXPENSE", category: "Entertainment", date: new Date("2026-02-20"), notes: "Streaming + dining" },
    { amount: 85000, type: "INCOME", category: "Salary", date: new Date("2026-03-01"), notes: "March salary" },
    { amount: 8000, type: "INCOME", category: "Business", date: new Date("2026-03-10"), notes: "Consulting fee" },
    { amount: 3500, type: "EXPENSE", category: "Housing", date: new Date("2026-03-05"), notes: "Rent" },
    { amount: 1100, type: "EXPENSE", category: "Food", date: new Date("2026-03-09"), notes: "Groceries" },
    { amount: 4500, type: "EXPENSE", category: "Healthcare", date: new Date("2026-03-15"), notes: "Medical checkup" },
    { amount: 3000, type: "EXPENSE", category: "Education", date: new Date("2026-03-20"), notes: "Online courses" },
    { amount: 85000, type: "INCOME", category: "Salary", date: new Date("2026-04-01"), notes: "April salary" },
    { amount: 1500, type: "EXPENSE", category: "Shopping", date: new Date("2026-04-02"), notes: "Clothes" },
    { amount: 600, type: "EXPENSE", category: "Utilities", date: new Date("2026-04-02"), notes: "Electricity + internet" },
  ];

  for (const record of sampleRecords) {
    await prisma.financialRecord.create({
      data: { ...record, createdById: admin.id },
    });
  }

  console.log(`Seeded ${sampleRecords.length} financial records`);
  console.log("\nSeed complete!");
  console.log("\nTest credentials:");
  console.log("  Admin:   admin@fintrack.com   / Admin@123");
  console.log("  Analyst: analyst@fintrack.com / Analyst@123");
  console.log("  Viewer:  viewer@fintrack.com  / Viewer@123");
};

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
