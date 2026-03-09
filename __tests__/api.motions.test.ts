import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/motions/route";

vi.mock("@/lib/db", () => ({
  prisma: {
    motion: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/db";

const mockMotion = {
  id: "m1",
  tier: "priority",
  program: "Safe Parking",
  councilFile: "24-0001",
  status: "In Committee",
  reportBackDue: null,
  lastScrapedAt: null,
  activities: [],
};

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/motions");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url);
}

describe("GET /api/motions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.motion.findMany).mockResolvedValue([mockMotion] as never);
    vi.mocked(prisma.motion.count).mockResolvedValue(1);
  });

  it("returns motions with pagination metadata", async () => {
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.motions).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(50);
    expect(body.pages).toBe(1);
  });

  it("passes tier filter to Prisma when tier is not 'all'", async () => {
    await GET(makeRequest({ tier: "priority" }));

    const whereArg = vi.mocked(prisma.motion.findMany).mock.calls[0][0]?.where;
    expect(whereArg?.tier).toBe("priority");
  });

  it("does not filter by tier when tier is 'all'", async () => {
    await GET(makeRequest({ tier: "all" }));

    const whereArg = vi.mocked(prisma.motion.findMany).mock.calls[0][0]?.where;
    expect(whereArg?.tier).toBeUndefined();
  });

  it("sets OR search filter when search param provided", async () => {
    await GET(makeRequest({ search: "parking" }));

    const whereArg = vi.mocked(prisma.motion.findMany).mock.calls[0][0]?.where;
    expect(whereArg?.OR).toBeDefined();
    expect(whereArg?.OR).toHaveLength(4);
  });

  it("does not set OR filter when search is empty", async () => {
    await GET(makeRequest({ search: "" }));

    const whereArg = vi.mocked(prisma.motion.findMany).mock.calls[0][0]?.where;
    expect(whereArg?.OR).toBeUndefined();
  });

  it("sets reportBackDue lt filter when needsAttention=true", async () => {
    await GET(makeRequest({ needsAttention: "true" }));

    const whereArg = vi.mocked(prisma.motion.findMany).mock.calls[0][0]?.where;
    expect(whereArg?.reportBackDue).toMatchObject({ lt: expect.any(Date) });
  });

  it("does not set reportBackDue filter when needsAttention=false", async () => {
    await GET(makeRequest({ needsAttention: "false" }));

    const whereArg = vi.mocked(prisma.motion.findMany).mock.calls[0][0]?.where;
    expect(whereArg?.reportBackDue).toBeUndefined();
  });

  it("calculates correct skip for page 2", async () => {
    await GET(makeRequest({ page: "2" }));

    const findManyArg = vi.mocked(prisma.motion.findMany).mock.calls[0][0];
    expect(findManyArg?.skip).toBe(50);
  });

  it("clamps page to minimum 1 for invalid page param", async () => {
    await GET(makeRequest({ page: "-5" }));

    const findManyArg = vi.mocked(prisma.motion.findMany).mock.calls[0][0];
    expect(findManyArg?.skip).toBe(0);
  });

  it("calculates pages correctly for multi-page result", async () => {
    vi.mocked(prisma.motion.count).mockResolvedValue(125);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.pages).toBe(3); // ceil(125/50)
  });
});
