import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerPerformanceTools } from "./performance.js";
import { collectTools, callTool } from "./harness.js";
import * as perf from "../lighthouse-performance.js";

vi.mock("../lighthouse-performance.js", () => ({
  getPerformanceScore: vi.fn(),
  getCoreWebVitals: vi.fn(),
  compareMobileDesktop: vi.fn(),
  checkPerformanceBudget: vi.fn(),
  getLcpOpportunities: vi.fn(),
}));

const tools = collectTools(registerPerformanceTools);

const metric = (title: string, value: number, displayValue: string, score: number) => ({
  title,
  value,
  displayValue,
  score,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("tools/performance registration", () => {
  it("registers all five performance tools with titles and read-only annotations", () => {
    expect([...tools.keys()]).toEqual([
      "get_performance_score",
      "get_core_web_vitals",
      "compare_mobile_desktop",
      "check_performance_budget",
      "get_lcp_opportunities",
    ]);

    for (const tool of tools.values()) {
      expect(tool.config.title).toBeTruthy();
      expect(tool.config.annotations).toEqual({ readOnlyHint: true, openWorldHint: true });
    }
  });
});

describe("get_performance_score", () => {
  it("returns the score with its metrics", async () => {
    vi.mocked(perf.getPerformanceScore).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      performanceScore: 82,
      fetchTime: "2026-01-01T00:00:00.000Z",
      metrics: { "largest-contentful-paint": metric("LCP", 1200, "1.2 s", 95) },
    });

    const { isError, payload } = await callTool(tools, "get_performance_score", { url: "https://example.com/" });

    expect(isError).toBe(false);
    expect(payload.data.performanceScore).toBe(82);
    expect(payload.data.metrics["largest-contentful-paint"]).toMatchObject({ value: "1.2 s", score: 95 });
  });

  it("returns an error result when the audit throws", async () => {
    vi.mocked(perf.getPerformanceScore).mockRejectedValue(new Error("unreachable"));

    const { isError, payload } = await callTool(tools, "get_performance_score", { url: "https://example.com/" });

    expect(isError).toBe(true);
    expect(payload.error).toBe("Performance analysis failed");
    expect(payload.message).toBe("unreachable");
  });
});

describe("get_core_web_vitals", () => {
  it("reports INP alongside the other vitals and passes thresholds through", async () => {
    vi.mocked(perf.getCoreWebVitals).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      fetchTime: "2026-01-01T00:00:00.000Z",
      coreWebVitals: {
        lcp: metric("LCP", 1200, "1.2 s", 95),
        fcp: metric("FCP", 800, "0.8 s", 99),
        cls: metric("CLS", 0.02, "0.02", 100),
        inp: undefined,
        tbt: metric("TBT", 150, "150 ms", 80),
      },
      thresholdResults: { lcp: true, inp: false, cls: true },
    });

    const threshold = { lcp: 2.5, inp: 200, cls: 0.1 };
    const { payload } = await callTool(tools, "get_core_web_vitals", { url: "https://example.com/", threshold });

    expect(perf.getCoreWebVitals).toHaveBeenCalledWith("https://example.com/", undefined, threshold);
    expect(payload.data.coreWebVitals.lcp).toMatchObject({ title: "LCP", value: "1.2 s" });
    // An absent INP still surfaces, falling back to the key name and an N/A value.
    expect(payload.data.coreWebVitals.inp).toMatchObject({ title: "INP", value: "N/A" });
    expect(payload.data.thresholdResults).toEqual({ lcp: true, inp: false, cls: true });
  });

  it("defaults thresholdResults to an empty object when none were requested", async () => {
    vi.mocked(perf.getCoreWebVitals).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      fetchTime: "2026-01-01T00:00:00.000Z",
      coreWebVitals: { lcp: metric("LCP", 1200, "1.2 s", 95) },
      thresholdResults: null,
    });

    const { payload } = await callTool(tools, "get_core_web_vitals", { url: "https://example.com/" });

    expect(payload.data.thresholdResults).toEqual({});
  });

  it("returns an error result when the audit throws", async () => {
    vi.mocked(perf.getCoreWebVitals).mockRejectedValue(new Error("cwv failed"));

    const { isError, payload } = await callTool(tools, "get_core_web_vitals", { url: "https://example.com/" });

    expect(isError).toBe(true);
    expect(payload.error).toBe("Core Web Vitals analysis failed");
  });
});

describe("compare_mobile_desktop", () => {
  it("labels which device performed better per category", async () => {
    vi.mocked(perf.compareMobileDesktop).mockResolvedValue({
      url: "https://example.com/",
      mobile: { categories: {}, metrics: {} },
      desktop: { categories: {}, metrics: {} },
      differences: {
        performance: { mobile: 60, desktop: 90, difference: 30 },
        seo: { mobile: 95, desktop: 90, difference: -5 },
      },
    });

    const { payload } = await callTool(tools, "compare_mobile_desktop", { url: "https://example.com/" });

    expect(payload.data.differences.performance.better).toBe("desktop");
    expect(payload.data.differences.seo.better).toBe("mobile");
  });

  it("returns an error result when the comparison throws", async () => {
    vi.mocked(perf.compareMobileDesktop).mockRejectedValue(new Error("compare failed"));

    const { isError, payload } = await callTool(tools, "compare_mobile_desktop", { url: "https://example.com/" });

    expect(isError).toBe(true);
    expect(payload.error).toBe("Mobile vs Desktop comparison failed");
  });
});

describe("check_performance_budget", () => {
  it("computes the difference between actual and budget per metric", async () => {
    vi.mocked(perf.checkPerformanceBudget).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      fetchTime: "2026-01-01T00:00:00.000Z",
      overallPassed: false,
      results: {
        largestContentfulPaint: { actual: 3000, budget: 2500, passed: false, unit: "ms" },
      },
    });

    const { payload } = await callTool(tools, "check_performance_budget", {
      url: "https://example.com/",
      budget: { largestContentfulPaint: 2500 },
    });

    expect(payload.data.overallPassed).toBe(false);
    expect(payload.data.results.largestContentfulPaint.difference).toBe(500);
    expect(payload.recommendations).toContain("Review failing metrics and optimize accordingly");
  });

  it("reports success when the budget is met", async () => {
    vi.mocked(perf.checkPerformanceBudget).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      fetchTime: "2026-01-01T00:00:00.000Z",
      overallPassed: true,
      results: {},
    });

    const { payload } = await callTool(tools, "check_performance_budget", {
      url: "https://example.com/",
      budget: {},
    });

    expect(payload.recommendations).toEqual(["Performance budget requirements met"]);
  });

  it("returns an error result when the check throws", async () => {
    vi.mocked(perf.checkPerformanceBudget).mockRejectedValue(new Error("budget failed"));

    const { isError, payload } = await callTool(tools, "check_performance_budget", {
      url: "https://example.com/",
      budget: {},
    });

    expect(isError).toBe(true);
    expect(payload.error).toBe("Performance budget check failed");
  });
});

describe("get_lcp_opportunities", () => {
  it("returns the insight opportunities when LCP needs improvement", async () => {
    vi.mocked(perf.getLcpOpportunities).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      fetchTime: "2026-01-01T00:00:00.000Z",
      lcpValue: 4.2,
      threshold: 2.5,
      needsImprovement: true,
      opportunities: [
        {
          id: "render-blocking-insight" as const,
          title: "Render blocking",
          description: "Requests are blocking the page's first paint",
          score: 0.4,
          displayValue: "300 ms",
          numericValue: 300,
        },
      ],
    });

    const { payload } = await callTool(tools, "get_lcp_opportunities", { url: "https://example.com/" });

    expect(payload.data.needsImprovement).toBe(true);
    expect(payload.data.opportunities[0].id).toBe("render-blocking-insight");
    expect(payload.recommendations).toContain("Minimize render-blocking resources");
  });

  it("reports an acceptable LCP without optimisation advice", async () => {
    vi.mocked(perf.getLcpOpportunities).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      fetchTime: "2026-01-01T00:00:00.000Z",
      lcpValue: 1.1,
      threshold: 2.5,
      needsImprovement: false,
      opportunities: [],
    });

    const { payload } = await callTool(tools, "get_lcp_opportunities", { url: "https://example.com/" });

    expect(payload.recommendations).toEqual(["LCP performance is within acceptable range"]);
    expect(payload.data.opportunities).toEqual([]);
  });

  it("returns an error result when the analysis throws", async () => {
    vi.mocked(perf.getLcpOpportunities).mockRejectedValue(new Error("lcp failed"));

    const { isError, payload } = await callTool(tools, "get_lcp_opportunities", { url: "https://example.com/" });

    expect(isError).toBe(true);
    expect(payload.error).toBe("LCP opportunities analysis failed");
  });
});
