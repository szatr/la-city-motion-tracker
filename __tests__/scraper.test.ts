import { describe, it, expect, vi, beforeEach } from "vitest";
import { scrapeCouncilFile, scrapeMotion } from "@/lib/scraper";

// Mock prisma so scraper.ts doesn't need a real DB
vi.mock("@/lib/db", () => ({
  prisma: {
    motion: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    activity: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// HTML fixtures
// ---------------------------------------------------------------------------

const FULL_HTML = `
<html><body>
  <div class="section">
    <table>
      <tr><td>Title</td><td>Establishing a Safe Parking Program</td></tr>
      <tr><td>Last Changed Date</td><td>03/15/2024</td></tr>
      <tr><td>Mover</td><td>Councilmember Raman</td></tr>
      <tr><td>Second</td><td>Councilmember Blumenfield</td></tr>
    </table>
  </div>
  <table class="inscrolltbl">
    <tr><th>Date</th><th>Activity</th></tr>
    <tr><td>01/10/2024</td><td>Motion referred to Public Safety Committee</td></tr>
    <tr><td>02/20/2024</td><td>Committee approved motion as amended</td></tr>
    <tr><td>03/15/2024</td><td>Council adopted motion</td></tr>
  </table>
</body></html>
`;

const NO_ACTIVITIES_HTML = `
<html><body>
  <div class="section">
    <table>
      <tr><td>Title</td><td>Sidewalk Vending Regulations</td></tr>
      <tr><td>Last Changed Date</td><td>01/05/2024</td></tr>
    </table>
  </div>
</body></html>
`;

const EMPTY_HTML = `<html><body><p>No record found.</p></body></html>`;

const BAD_DATE_HTML = `
<html><body>
  <div class="section">
    <table>
      <tr><td>Title</td><td>Some Motion</td></tr>
      <tr><td>Last Changed Date</td><td>not-a-date</td></tr>
    </table>
  </div>
  <table>
    <tr><th>Date</th><th>Activity</th></tr>
    <tr><td>not-a-date</td><td>Some action</td></tr>
    <tr><td>05/01/2024</td><td>Valid action</td></tr>
  </table>
</body></html>
`;

// ---------------------------------------------------------------------------
// scrapeCouncilFile — mock fetch, test parsing
// ---------------------------------------------------------------------------

function mockFetch(html: string, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 404,
      statusText: ok ? "OK" : "Not Found",
      text: async () => html,
    })
  );
}

describe("scrapeCouncilFile", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses title, lastChanged, mover, second from section table", async () => {
    mockFetch(FULL_HTML);
    const result = await scrapeCouncilFile("24-0001");

    expect(result.title).toBe("Establishing a Safe Parking Program");
    expect(result.mover).toBe("Councilmember Raman");
    expect(result.second).toBe("Councilmember Blumenfield");
    expect(result.lastChanged).toBeInstanceOf(Date);
    expect(result.lastChanged!.getFullYear()).toBe(2024);
  });

  it("parses activity rows from table", async () => {
    mockFetch(FULL_HTML);
    const result = await scrapeCouncilFile("24-0001");

    expect(result.activities).toHaveLength(3);
    expect(result.activities[0].activity).toBe(
      "Motion referred to Public Safety Committee"
    );
    expect(result.activities[0].date).toBeInstanceOf(Date);
    expect(result.activities[2].activity).toBe("Council adopted motion");
  });

  it("returns empty activities when no activity table present", async () => {
    mockFetch(NO_ACTIVITIES_HTML);
    const result = await scrapeCouncilFile("24-0002");

    expect(result.activities).toHaveLength(0);
    expect(result.title).toBe("Sidewalk Vending Regulations");
  });

  it("returns empty result for page with no parseable content", async () => {
    mockFetch(EMPTY_HTML);
    const result = await scrapeCouncilFile("99-9999");

    expect(result.title).toBeUndefined();
    expect(result.activities).toHaveLength(0);
  });

  it("skips activity rows with invalid dates", async () => {
    mockFetch(BAD_DATE_HTML);
    const result = await scrapeCouncilFile("24-0003");

    // Only the row with a valid date should be included
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].activity).toBe("Valid action");
  });

  it("does not set lastChanged when date string is invalid", async () => {
    mockFetch(BAD_DATE_HTML);
    const result = await scrapeCouncilFile("24-0003");

    expect(result.lastChanged).toBeUndefined();
  });

  it("throws on non-ok HTTP response", async () => {
    mockFetch("", false);
    await expect(scrapeCouncilFile("00-0000")).rejects.toThrow(
      "Failed to fetch"
    );
  });

  it("encodes council file number in the URL", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => EMPTY_HTML,
    });
    vi.stubGlobal("fetch", fetchSpy);

    await scrapeCouncilFile("24-0001 (part)");
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain(encodeURIComponent("24-0001 (part)"));
  });
});

// ---------------------------------------------------------------------------
// scrapeMotion — tests DB interaction
// ---------------------------------------------------------------------------

describe("scrapeMotion", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("throws when motion has no councilFile", async () => {
    vi.mocked(prisma.motion.findUnique).mockResolvedValue({
      id: "abc",
      councilFile: null,
    } as never);

    await expect(scrapeMotion("abc")).rejects.toThrow("has no councilFile");
  });

  it("throws when motion is not found", async () => {
    vi.mocked(prisma.motion.findUnique).mockResolvedValue(null);

    await expect(scrapeMotion("missing")).rejects.toThrow("has no councilFile");
  });

  it("calls $transaction with delete, creates, and update", async () => {
    vi.mocked(prisma.motion.findUnique).mockResolvedValue({
      id: "abc",
      councilFile: "24-0001",
      scrapedTitle: null,
      scrapedLastChanged: null,
      scrapedMover: null,
      scrapedSecond: null,
    } as never);

    mockFetch(FULL_HTML);

    vi.mocked(prisma.$transaction).mockResolvedValue([]);

    await scrapeMotion("abc");

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    const txArgs = vi.mocked(prisma.$transaction).mock.calls[0][0] as unknown[];
    // delete + 3 activity creates + 1 motion update = 5 operations
    expect(txArgs).toHaveLength(5);
  });
});
