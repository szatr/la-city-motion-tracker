import * as cheerio from "cheerio";
import { prisma } from "./db";

const CLERK_BASE_URL =
  "https://cityclerk.lacity.org/lacityclerkconnect/index.cfm?fa=ccfi.viewrecord&cfnumber=";

export interface ScrapeResult {
  title?: string;
  lastChanged?: Date;
  mover?: string;
  second?: string;
  activities: Array<{ date: Date; activity: string }>;
}

export async function scrapeCouncilFile(
  councilFile: string
): Promise<ScrapeResult> {
  const url = `${CLERK_BASE_URL}${encodeURIComponent(councilFile)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; LA-Motion-Tracker/1.0; +https://github.com)",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const result: ScrapeResult = { activities: [] };

  // Parse labeled fields from sections
  $("div.section, .sectionBody, .detailContainer, table").each((_, el) => {
    $(el)
      .find("td, span, div")
      .each((_, cell) => {
        const text = $(cell).text().trim();
        const next = $(cell).next().text().trim();

        if (/^title$/i.test(text) && next) result.title = next;
        if (/last changed date/i.test(text) && next) {
          const d = new Date(next);
          if (!isNaN(d.getTime())) result.lastChanged = d;
        }
        if (/^mover$/i.test(text) && next) result.mover = next;
        if (/^second$/i.test(text) && next) result.second = next;
      });
  });

  // Fallback: scan all text nodes for labeled pairs
  if (!result.title) {
    $("*").each((_, el) => {
      const ownText = $(el).clone().children().remove().end().text().trim();
      if (/^title$/i.test(ownText)) {
        const sibling = $(el).next().text().trim();
        if (sibling) result.title = sibling;
      }
      if (/last changed date/i.test(ownText)) {
        const sibling = $(el).next().text().trim();
        const d = new Date(sibling);
        if (!isNaN(d.getTime())) result.lastChanged = d;
      }
    });
  }

  // Parse activity table rows
  $("table").each((_, table) => {
    const headers = $(table)
      .find("tr")
      .first()
      .find("th, td")
      .map((_, th) => $(th).text().trim().toLowerCase())
      .get();

    const dateIdx = headers.findIndex((h) => h.includes("date"));
    const actIdx = headers.findIndex(
      (h) => h.includes("activity") || h.includes("action")
    );

    if (dateIdx === -1 || actIdx === -1) return;

    $(table)
      .find("tr")
      .slice(1)
      .each((_, row) => {
        const cells = $(row).find("td");
        const dateStr = $(cells[dateIdx]).text().trim();
        const actText = $(cells[actIdx]).text().trim();
        if (!dateStr || !actText) return;
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          result.activities.push({ date: d, activity: actText });
        }
      });
  });

  return result;
}

export async function scrapeMotion(motionId: string): Promise<void> {
  const motion = await prisma.motion.findUnique({ where: { id: motionId } });
  if (!motion?.councilFile) {
    throw new Error(`Motion ${motionId} has no councilFile`);
  }

  const scraped = await scrapeCouncilFile(motion.councilFile);

  // Upsert activities: delete old ones and insert fresh
  await prisma.$transaction([
    prisma.activity.deleteMany({ where: { motionId } }),
    ...scraped.activities.map((a) =>
      prisma.activity.create({
        data: { motionId, date: a.date, activity: a.activity },
      })
    ),
    prisma.motion.update({
      where: { id: motionId },
      data: {
        scrapedTitle: scraped.title ?? motion.scrapedTitle,
        scrapedLastChanged:
          scraped.lastChanged ?? motion.scrapedLastChanged,
        scrapedMover: scraped.mover ?? motion.scrapedMover,
        scrapedSecond: scraped.second ?? motion.scrapedSecond,
        lastScrapedAt: new Date(),
      },
    }),
  ]);
}
