import { PrismaClient } from "./generated/prisma";

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    // log: ['query'], // 개발 중 쿼리 로그 확인 시 주석 해제
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
