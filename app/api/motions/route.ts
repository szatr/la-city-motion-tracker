import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { program, councilFile, tier, status, reportBackDue, originalMotionUrl } = body;

  if (!program?.trim()) {
    return NextResponse.json({ error: "Program name is required" }, { status: 400 });
  }
  if (!["priority", "tier2", "passed"].includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  // Check for duplicate council file
  if (councilFile?.trim()) {
    const existing = await prisma.motion.findUnique({
      where: { councilFile: councilFile.trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Council file ${councilFile.trim()} is already tracked` },
        { status: 409 }
      );
    }
  }

  const motion = await prisma.motion.create({
    data: {
      program: program.trim(),
      tier,
      councilFile: councilFile?.trim() || null,
      status: status?.trim() || null,
      reportBackDue: reportBackDue ? new Date(reportBackDue) : null,
      originalMotionUrl: originalMotionUrl?.trim() || null,
    },
  });

  return NextResponse.json(motion, { status: 201 });
}

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
