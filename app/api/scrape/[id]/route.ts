import { NextRequest, NextResponse } from "next/server";
import { scrapeMotion } from "@/lib/scraper";
import { prisma } from "@/lib/db";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const motion = await prisma.motion.findUnique({
    where: { id },
    select: { id: true, councilFile: true },
  });

  if (!motion) {
    return NextResponse.json({ error: "Motion not found" }, { status: 404 });
  }

  if (!motion.councilFile) {
    return NextResponse.json(
      { error: "Motion has no council file number" },
      { status: 400 }
    );
  }

  try {
    await scrapeMotion(id);
    const updated = await prisma.motion.findUnique({
      where: { id },
      include: { activities: { orderBy: { date: "desc" } } },
    });
    return NextResponse.json({ success: true, motion: updated });
  } catch (error) {
    console.error(`Scrape failed for motion ${id}:`, error);
    return NextResponse.json(
      { error: `Scrape failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
