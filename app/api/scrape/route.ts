import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scrapeMotion } from "@/lib/scraper";

const DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST() {
  const motions = await prisma.motion.findMany({
    where: { councilFile: { not: null } },
    select: { id: true, councilFile: true },
    orderBy: { createdAt: "asc" },
  });

  const results: Array<{ id: string; councilFile: string | null; success: boolean; error?: string }> = [];

  for (const motion of motions) {
    try {
      await scrapeMotion(motion.id);
      results.push({ id: motion.id, councilFile: motion.councilFile, success: true });
    } catch (error) {
      results.push({
        id: motion.id,
        councilFile: motion.councilFile,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await sleep(DELAY_MS);
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({ total: motions.length, succeeded, failed, results });
}
