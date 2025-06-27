import { PrismaClient } from "@/generated/prisma";

const globaForPrisma = global as unknown as {
  prisma: PrismaClient;
};

export const prisma = globaForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globaForPrisma.prisma = prisma;
