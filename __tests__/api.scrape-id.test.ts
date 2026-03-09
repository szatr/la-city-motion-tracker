import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/scrape/[id]/route";

vi.mock("@/lib/db", () => ({
  prisma: {
    motion: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/scraper", () => ({
  scrapeMotion: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { scrapeMotion } from "@/lib/scraper";

const mockMotionWithFile = {
  id: "m1",
  councilFile: "24-0001",
  program: "Safe Parking",
  activities: [],
};

const mockMotionNoFile = {
  id: "m2",
  councilFile: null,
};

function makeRequest(id: string) {
  return [
    new NextRequest(`http://localhost/api/scrape/${id}`, { method: "POST" }),
    { params: Promise.resolve({ id }) },
  ] as const;
}

describe("POST /api/scrape/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns 404 when motion not found", async () => {
    vi.mocked(prisma.motion.findUnique).mockResolvedValue(null);

    const res = await POST(...makeRequest("missing"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  it("returns 400 when motion has no councilFile", async () => {
    vi.mocked(prisma.motion.findUnique).mockResolvedValue(
      mockMotionNoFile as never
    );

    const res = await POST(...makeRequest("m2"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/no council file/i);
  });

  it("calls scrapeMotion and returns 200 on success", async () => {
    vi.mocked(prisma.motion.findUnique)
      .mockResolvedValueOnce(mockMotionWithFile as never) // existence check
      .mockResolvedValueOnce(mockMotionWithFile as never); // fetch updated motion
    vi.mocked(scrapeMotion).mockResolvedValue(undefined);

    const res = await POST(...makeRequest("m1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(scrapeMotion).toHaveBeenCalledWith("m1");
  });

  it("returns 500 when scrapeMotion throws", async () => {
    vi.mocked(prisma.motion.findUnique).mockResolvedValue(
      mockMotionWithFile as never
    );
    vi.mocked(scrapeMotion).mockRejectedValue(new Error("Network timeout"));

    const res = await POST(...makeRequest("m1"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Network timeout");
  });
});
