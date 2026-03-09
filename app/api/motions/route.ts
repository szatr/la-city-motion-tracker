import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get("tier");
  const search = searchParams.get("search") ?? "";
  const needsAttention = searchParams.get("needsAttention") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = 50;

  const where: Prisma.MotionWhereInput = {};

  if (tier && tier !== "all") {
    where.tier = tier;
  }

  if (search) {
    where.OR = [
      { program: { contains: search, mode: "insensitive" } },
      { councilFile: { contains: search, mode: "insensitive" } },
      { status: { contains: search, mode: "insensitive" } },
      { scrapedTitle: { contains: search, mode: "insensitive" } },
    ];
  }

  if (needsAttention) {
    where.reportBackDue = { lt: new Date() };
  }

  const [motions, total] = await Promise.all([
    prisma.motion.findMany({
      where,
      include: { activities: { orderBy: { date: "desc" } } },
      orderBy: [{ tier: "asc" }, { reportBackDue: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.motion.count({ where }),
  ]);

  return NextResponse.json({
    motions,
    total,
    page,
    pageSize,
    pages: Math.ceil(total / pageSize),
  });
}
