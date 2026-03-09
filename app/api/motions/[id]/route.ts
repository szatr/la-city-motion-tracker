import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { program, councilFile, tier, status, reportBackDue, originalMotionUrl } = body;

  const motion = await prisma.motion.findUnique({ where: { id } });
  if (!motion) {
    return NextResponse.json({ error: "Motion not found" }, { status: 404 });
  }

  if (program !== undefined && !program.trim()) {
    return NextResponse.json({ error: "Program name cannot be empty" }, { status: 400 });
  }

  if (tier !== undefined && !["priority", "tier2", "passed"].includes(tier)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  // Check council file uniqueness if it's changing
  const newCouncilFile = councilFile?.trim() || null;
  if (newCouncilFile && newCouncilFile !== motion.councilFile) {
    const conflict = await prisma.motion.findUnique({ where: { councilFile: newCouncilFile } });
    if (conflict) {
      return NextResponse.json(
        { error: `Council file ${newCouncilFile} is already tracked` },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.motion.update({
    where: { id },
    data: {
      ...(program !== undefined && { program: program.trim() }),
      ...(councilFile !== undefined && { councilFile: newCouncilFile }),
      ...(tier !== undefined && { tier }),
      ...(status !== undefined && { status: status?.trim() || null }),
      ...(reportBackDue !== undefined && {
        reportBackDue: reportBackDue ? new Date(reportBackDue) : null,
      }),
      ...(originalMotionUrl !== undefined && {
        originalMotionUrl: originalMotionUrl?.trim() || null,
      }),
    },
    include: { activities: { orderBy: { date: "desc" } } },
  });

  return NextResponse.json(updated);
}
