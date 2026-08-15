import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAuditTools } from "./audit.js";
import { collectTools, callTool } from "./harness.js";
import * as core from "../lighthouse-core.js";
import * as categories from "../lighthouse-categories.js";

vi.mock("../lighthouse-core.js", () => ({ runLighthouseAudit: vi.fn() }));
vi.mock("../lighthouse-categories.js", () => ({
  getAccessibilityScore: vi.fn(),
  getSeoAnalysis: vi.fn(),
}));

const tools = collectTools(registerAuditTools);

const detailedAudits = [
  { id: "color-contrast", title: "Contrast", description: "Colours contrast", score: 0.5, displayValue: "2 issues" },
  { id: "image-alt", title: "Alt text", description: "Images have alt", score: null, displayValue: undefined },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("tools/audit registration", () => {
  it("registers the three surviving audit tools", () => {
    expect([...tools.keys()]).toEqual(["run_audit", "get_accessibility_score", "get_seo_analysis"]);
  });

  it("does not register the removed PWA tool", () => {
    expect(tools.has("check_pwa_readiness")).toBe(false);
  });

  it("marks every tool read-only and open-world with a title", () => {
    for (const tool of tools.values()) {
      expect(tool.config.title).toBeTruthy();
      expect(tool.config.annotations).toEqual({ readOnlyHint: true, openWorldHint: true });
    }
  });
});

describe("run_audit", () => {
  it("flattens categories and metrics into the structured payload", async () => {
    vi.mocked(core.runLighthouseAudit).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      fetchTime: "2026-01-01T00:00:00.000Z",
      version: "13.4.1",
      userAgent: "test",
      categories: { performance: { title: "Performance", score: 90, description: "" } },
      metrics: {
        "largest-contentful-paint": { title: "LCP", value: 1200, displayValue: "1.2 s", score: 95 },
      },
    });

    const { isError, payload } = await callTool(tools, "run_audit", { url: "https://example.com/", device: "desktop" });

    expect(isError).toBe(false);
    expect(payload.data.categories.performance).toEqual({ title: "Performance", score: 90 });
    expect(payload.data.metrics["largest-contentful-paint"]).toEqual({ title: "LCP", value: "1.2 s", score: 95 });
    expect(payload.data.version).toBe("13.4.1");
    expect(payload.summary).toContain("https://example.com/");
  });

  it("returns troubleshooting hints when the audit throws", async () => {
    vi.mocked(core.runLighthouseAudit).mockRejectedValue(new Error("no chrome"));

    const { isError, payload } = await callTool(tools, "run_audit", { url: "https://example.com/" });

    expect(isError).toBe(true);
    expect(payload.error).toBe("Lighthouse audit failed");
    expect(payload.message).toBe("no chrome");
    expect(payload.device).toBe("desktop");
    expect(payload.troubleshooting.length).toBeGreaterThan(0);
  });
});

describe("get_accessibility_score", () => {
  it("returns the bare score when details are not requested", async () => {
    vi.mocked(categories.getAccessibilityScore).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      accessibilityScore: 88,
      fetchTime: "2026-01-01T00:00:00.000Z",
    });

    const { payload } = await callTool(tools, "get_accessibility_score", {
      url: "https://example.com/",
      device: "desktop",
      includeDetails: false,
    });

    expect(payload.data.accessibilityScore).toBe(88);
    expect(payload.data).not.toHaveProperty("audits");
  });

  it("scales audit scores to percentages and defaults missing display values", async () => {
    vi.mocked(categories.getAccessibilityScore).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      accessibilityScore: 88,
      fetchTime: "2026-01-01T00:00:00.000Z",
      audits: detailedAudits,
    });

    const { payload } = await callTool(tools, "get_accessibility_score", {
      url: "https://example.com/",
      device: "desktop",
      includeDetails: true,
    });

    expect(payload.data.audits[0]).toMatchObject({ title: "Contrast", score: 50, displayValue: "2 issues" });
    expect(payload.data.audits[1]).toMatchObject({ score: null, displayValue: "N/A" });
  });

  it("returns an error result when the analysis throws", async () => {
    vi.mocked(categories.getAccessibilityScore).mockRejectedValue(new Error("boom"));

    const { isError, payload } = await callTool(tools, "get_accessibility_score", { url: "https://example.com/" });

    expect(isError).toBe(true);
    expect(payload.error).toBe("Accessibility analysis failed");
  });
});

describe("get_seo_analysis", () => {
  it("returns the SEO score with optional audit details", async () => {
    vi.mocked(categories.getSeoAnalysis).mockResolvedValue({
      url: "https://example.com/",
      device: "mobile",
      seoScore: 95,
      fetchTime: "2026-01-01T00:00:00.000Z",
      audits: detailedAudits,
    });

    const { payload } = await callTool(tools, "get_seo_analysis", {
      url: "https://example.com/",
      device: "mobile",
      includeDetails: true,
    });

    expect(payload.data.seoScore).toBe(95);
    expect(payload.data.audits).toHaveLength(2);
  });

  it("returns an error result when the analysis throws", async () => {
    vi.mocked(categories.getSeoAnalysis).mockRejectedValue("string failure");

    const { isError, payload } = await callTool(tools, "get_seo_analysis", { url: "https://example.com/" });

    expect(isError).toBe(true);
    expect(payload.error).toBe("SEO analysis failed");
    expect(payload.message).toBe("string failure");
  });
});
