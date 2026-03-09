import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scrapeMotion } from "@/lib/scraper";

const DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const motions = await prisma.motion.findMany({
    where: { councilFile: { not: null } },
    select: { id: true, councilFile: true },
    orderBy: { createdAt: "asc" },
  });

  let succeeded = 0;
  let failed = 0;

  for (const motion of motions) {
    try {
      await scrapeMotion(motion.id);
      succeeded++;
    } catch (error) {
      console.error(`Cron scrape failed for ${motion.councilFile}:`, error);
      failed++;
    }
    await sleep(DELAY_MS);
  }

  console.log(`Cron scrape complete: ${succeeded} succeeded, ${failed} failed`);
  return NextResponse.json({ total: motions.length, succeeded, failed });
}
