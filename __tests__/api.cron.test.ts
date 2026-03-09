import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/cron/scrape/route";

vi.mock("@/lib/db", () => ({
  prisma: {
    motion: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/scraper", () => ({
  scrapeMotion: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { scrapeMotion } from "@/lib/scraper";

const twoMotions = [
  { id: "m1", councilFile: "24-0001" },
  { id: "m2", councilFile: "24-0002" },
];

function makeRequest(authHeader?: string) {
  return new NextRequest("http://localhost/api/cron/scrape", {
    headers: authHeader ? { authorization: authHeader } : {},
  });
}

describe("GET /api/cron/scrape", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.mocked(prisma.motion.findMany).mockResolvedValue(twoMotions as never);
    vi.mocked(scrapeMotion).mockResolvedValue(undefined);
  });

  it("returns 401 when CRON_SECRET is set and no auth header provided", async () => {
    vi.stubEnv("CRON_SECRET", "secret123");

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 401 when CRON_SECRET is set and wrong token provided", async () => {
    vi.stubEnv("CRON_SECRET", "secret123");

    const res = await GET(makeRequest("Bearer wrongtoken"));
    expect(res.status).toBe(401);
  });

  it("succeeds with correct Bearer token", async () => {
    vi.stubEnv("CRON_SECRET", "secret123");

    const res = await GET(makeRequest("Bearer secret123"));
    expect(res.status).toBe(200);
  });

  it("succeeds without auth check when CRON_SECRET is not set", async () => {
    delete process.env.CRON_SECRET;

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });

  it("scrapes all motions with councilFiles and returns counts", async () => {
    vi.stubEnv("CRON_SECRET", "s");
    vi.mocked(scrapeMotion).mockResolvedValue(undefined);

    const res = await GET(makeRequest("Bearer s"));
    const body = await res.json();

    expect(scrapeMotion).toHaveBeenCalledTimes(2);
    expect(body.total).toBe(2);
    expect(body.succeeded).toBe(2);
    expect(body.failed).toBe(0);
  });

  it("counts failures when scrapeMotion throws", async () => {
    vi.stubEnv("CRON_SECRET", "s");
    vi.mocked(scrapeMotion)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("timeout"));

    const res = await GET(makeRequest("Bearer s"));
    const body = await res.json();

    expect(body.succeeded).toBe(1);
    expect(body.failed).toBe(1);
    expect(body.total).toBe(2);
  });
});
