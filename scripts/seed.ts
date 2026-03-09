import * as XLSX from "xlsx";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type TierName = "priority" | "tier2" | "passed";

const SHEET_TO_TIER: Record<string, TierName> = {
  Priority: "priority",
  "Tier 2": "tier2",
  Passed: "passed",
};

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  // Excel serial number
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  if (typeof val === "string") {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function coerceString(val: unknown): string | null {
  if (val === null || val === undefined || val === "") return null;
  return String(val).trim() || null;
}

async function main() {
  const filePath = path.resolve(
    process.cwd(),
    "LA City motion tracker.xlsx"
  );
  console.log(`Reading ${filePath}`);
  const workbook = XLSX.readFile(filePath);

  let totalUpserted = 0;

  for (const [sheetName, tier] of Object.entries(SHEET_TO_TIER)) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.warn(`Sheet "${sheetName}" not found, skipping`);
      continue;
    }

    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    });

    // Skip header row
    const dataRows = rows.slice(1);
    let count = 0;

    for (const row of dataRows) {
      const program = coerceString(row[0]);
      if (!program) continue; // skip empty rows

      const dateReceived = parseDate(row[1]);
      const councilFile = coerceString(row[2]);
      const expiration = parseDate(row[3]);
      const status = coerceString(row[4]);
      const reportBackDue = parseDate(row[5]);
      const statusDate = parseDate(row[6]);
      const originalMotionUrl = coerceString(row[7]);

      // Upsert key: councilFile if present, otherwise program+tier
      const whereClause = councilFile
        ? { councilFile }
        : undefined;

      const data = {
        tier,
        program,
        dateReceived,
        councilFile,
        expiration,
        status,
        reportBackDue,
        statusDate,
        originalMotionUrl,
      };

      if (whereClause) {
        await prisma.motion.upsert({
          where: whereClause,
          update: data,
          create: data,
        });
      } else {
        // No councilFile — check by program+tier to avoid duplicates
        const existing = await prisma.motion.findFirst({
          where: { program, tier },
        });
        if (existing) {
          await prisma.motion.update({ where: { id: existing.id }, data });
        } else {
          await prisma.motion.create({ data });
        }
      }
      count++;
    }

    console.log(`  ${sheetName} (${tier}): ${count} rows upserted`);
    totalUpserted += count;
  }

  console.log(`\nDone. Total: ${totalUpserted} motions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
