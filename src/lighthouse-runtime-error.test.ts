import { describe, it, expect, vi, beforeEach } from "vitest";

const lighthouseMock = vi.fn();

vi.mock("lighthouse", () => ({ default: lighthouseMock }));
vi.mock("chrome-launcher", () => ({
  launch: vi.fn(async () => ({ port: 9222, kill: vi.fn(async () => undefined) })),
}));

const { runRawLighthouseAudit } = await import("./lighthouse-core.js");

const baseLhr = {
  finalDisplayedUrl: "https://example.com/",
  fetchTime: "2026-01-01T00:00:00.000Z",
  lighthouseVersion: "13.4.1",
  userAgent: "test",
  categories: { performance: { title: "Performance", score: null, description: "" } },
  audits: {},
};

describe("runRawLighthouseAudit runtime errors", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when Lighthouse reports a page load failure", async () => {
    lighthouseMock.mockResolvedValue({
      lhr: {
        ...baseLhr,
        runtimeError: {
          code: "CHROME_INTERSTITIAL_ERROR",
          message: "Chrome prevented page load with an interstitial.",
        },
      },
    });

    // Lighthouse resolves instead of rejecting here, so without the guard the caller
    // would report a successful audit that happens to score zero.
    await expect(runRawLighthouseAudit("https://example.com/")).rejects.toThrow(/CHROME_INTERSTITIAL_ERROR/);
  });

  it("does not throw for the NO_ERROR sentinel", async () => {
    lighthouseMock.mockResolvedValue({
      lhr: { ...baseLhr, runtimeError: { code: "NO_ERROR", message: "" } },
    });

    await expect(runRawLighthouseAudit("https://example.com/")).resolves.toBeDefined();
  });

  it("does not throw when no runtime error is present", async () => {
    lighthouseMock.mockResolvedValue({ lhr: baseLhr });

    await expect(runRawLighthouseAudit("https://example.com/")).resolves.toBeDefined();
  });

  it("throws when Lighthouse returns nothing at all", async () => {
    lighthouseMock.mockResolvedValue(undefined);

    await expect(runRawLighthouseAudit("https://example.com/")).rejects.toThrow(/Failed to run Lighthouse audit/);
  });
});
