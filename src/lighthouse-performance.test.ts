/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPerformanceScore,
  getCoreWebVitals,
  compareMobileDesktop,
  checkPerformanceBudget,
  getLcpOpportunities,
} from "./lighthouse-performance";
import * as lighthouseCore from "./lighthouse-core";
import { DEFAULTS, LCP_OPPORTUNITIES } from "./lighthouse-constants";

// Mock the lighthouse-core module
vi.mock("./lighthouse-core", () => ({
  runLighthouseAudit: vi.fn(),
  runRawLighthouseAudit: vi.fn(),
}));

describe("lighthouse-performance", () => {
  const mockUrl = "https://example.com";
  const mockFetchTime = "2024-01-01T00:00:00.000Z";

  const mockMetrics = {
    "first-contentful-paint": {
      title: "First Contentful Paint",
      value: 1200,
      displayValue: "1.2 s",
      score: 90,
    },
    "largest-contentful-paint": {
      title: "Largest Contentful Paint",
      value: 2500,
      displayValue: "2.5 s",
      score: 80,
    },
    "cumulative-layout-shift": {
      title: "Cumulative Layout Shift",
      value: 0.05,
      displayValue: "0.05",
      score: 95,
    },
    "total-blocking-time": {
      title: "Total Blocking Time",
      value: 150,
      displayValue: "150 ms",
      score: 85,
    },
    "speed-index": {
      title: "Speed Index",
      value: 3000,
      displayValue: "3.0 s",
      score: 75,
    },
  };

  const mockLighthouseResult = {
    url: mockUrl,
    device: "desktop" as const,
    fetchTime: mockFetchTime,
    version: "12.0.0",
    userAgent: "Test Agent",
    categories: {
      performance: { title: "Performance", score: 85, description: "Performance category" },
    },
    metrics: mockMetrics,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPerformanceScore", () => {
    it("should return performance score with metrics", async () => {
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(mockLighthouseResult);

      const result = await getPerformanceScore(mockUrl, "desktop");

      expect(lighthouseCore.runLighthouseAudit).toHaveBeenCalledWith(mockUrl, ["performance"], "desktop");
      expect(result).toEqual({
        url: mockUrl,
        device: "desktop",
        performanceScore: 85,
        metrics: mockMetrics,
        fetchTime: mockFetchTime,
      });
    });

    it("should handle missing performance category", async () => {
      const resultWithoutPerformance = {
        ...mockLighthouseResult,
        categories: {},
      };
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(resultWithoutPerformance);

      const result = await getPerformanceScore(mockUrl);

      expect(result.performanceScore).toBe(0);
    });

    it("should use default device parameter", async () => {
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(mockLighthouseResult);

      await getPerformanceScore(mockUrl);

      expect(lighthouseCore.runLighthouseAudit).toHaveBeenCalledWith(mockUrl, ["performance"], "desktop");
    });
  });

  describe("getCoreWebVitals", () => {
    it("should return Core Web Vitals without thresholds", async () => {
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(mockLighthouseResult);

      const result = await getCoreWebVitals(mockUrl);

      expect(result).toEqual({
        url: mockUrl,
        device: "desktop",
        coreWebVitals: {
          lcp: mockMetrics["largest-contentful-paint"],
          fcp: mockMetrics["first-contentful-paint"],
          cls: mockMetrics["cumulative-layout-shift"],
          tbt: mockMetrics["total-blocking-time"],
        },
        thresholdResults: null,
        fetchTime: mockFetchTime,
      });
    });

    it("should check against thresholds when provided", async () => {
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(mockLighthouseResult);

      const thresholds = {
        lcp: 3.0, // Pass: 2.5s <= 3.0s
        fid: 100, // Fail: 150ms > 100ms (using TBT as proxy)
        cls: 0.1, // Pass: 0.05 <= 0.1
      };

      const result = await getCoreWebVitals(mockUrl, "mobile", thresholds);

      expect(result.thresholdResults).toEqual({
        lcp: true, // 2.5s <= 3.0s
        fid: false, // 150ms > 100ms
        cls: true, // 0.05 <= 0.1
      });
    });

    it("should handle missing metrics gracefully", async () => {
      const resultWithoutMetrics = {
        ...mockLighthouseResult,
        metrics: {},
      };
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(resultWithoutMetrics);

      const result = await getCoreWebVitals(mockUrl);

      expect(result.coreWebVitals.lcp).toBeUndefined();
      expect(result.coreWebVitals.fcp).toBeUndefined();
      expect(result.coreWebVitals.cls).toBeUndefined();
      expect(result.coreWebVitals.tbt).toBeUndefined();
    });
  });

  describe("compareMobileDesktop", () => {
    it("should compare mobile and desktop performance", async () => {
      const mobileResult = { ...mockLighthouseResult, device: "mobile" as const };
      const desktopResult = { ...mockLighthouseResult, device: "desktop" as const };

      // Mock sequential calls
      vi.mocked(lighthouseCore.runLighthouseAudit)
        .mockResolvedValueOnce(mobileResult)
        .mockResolvedValueOnce(desktopResult);

      const result = await compareMobileDesktop(mockUrl, ["performance"], true);

      expect(lighthouseCore.runLighthouseAudit).toHaveBeenCalledTimes(2);
      expect(lighthouseCore.runLighthouseAudit).toHaveBeenNthCalledWith(1, mockUrl, ["performance"], "mobile", true);
      expect(lighthouseCore.runLighthouseAudit).toHaveBeenNthCalledWith(2, mockUrl, ["performance"], "desktop", true);

      expect(result).toMatchObject({
        url: mockUrl,
        mobile: {
          categories: mobileResult.categories,
          metrics: mobileResult.metrics,
        },
        desktop: {
          categories: desktopResult.categories,
          metrics: desktopResult.metrics,
        },
      });

      expect(result.differences.performance).toEqual({
        mobile: 85,
        desktop: 85,
        difference: 0,
      });
    });

    it("should handle different scores between devices", async () => {
      const mobileResult = {
        ...mockLighthouseResult,
        device: "mobile" as const,
        categories: {
          performance: { title: "Performance", score: 75, description: "Performance category" },
        },
      };
      const desktopResult = {
        ...mockLighthouseResult,
        device: "desktop" as const,
        categories: {
          performance: { title: "Performance", score: 85, description: "Performance category" },
        },
      };

      vi.mocked(lighthouseCore.runLighthouseAudit)
        .mockResolvedValueOnce(mobileResult)
        .mockResolvedValueOnce(desktopResult);

      const result = await compareMobileDesktop(mockUrl);

      expect(result.differences.performance).toEqual({
        mobile: 75,
        desktop: 85,
        difference: 10, // desktop - mobile
      });
    });
  });

  describe("checkPerformanceBudget", () => {
    it("should check performance budget and return results", async () => {
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(mockLighthouseResult);

      const budget = {
        performanceScore: 80, // Pass: 85 >= 80
        firstContentfulPaint: 1500, // Pass: 1200 <= 1500
        largestContentfulPaint: 2000, // Fail: 2500 > 2000
        totalBlockingTime: 200, // Pass: 150 <= 200
      };

      const result = await checkPerformanceBudget(mockUrl, "desktop", budget);

      expect(result.overallPassed).toBe(false); // Due to LCP failure
      expect(result.results.performanceScore).toEqual({
        actual: 85,
        budget: 80,
        passed: true,
        unit: "score",
      });
      expect(result.results.firstContentfulPaint).toEqual({
        actual: 1200,
        budget: 1500,
        passed: true,
        unit: "ms",
      });
      expect(result.results.largestContentfulPaint).toEqual({
        actual: 2500,
        budget: 2000,
        passed: false,
        unit: "ms",
      });
    });

    it("should pass when all budgets are met", async () => {
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(mockLighthouseResult);

      const budget = {
        performanceScore: 80,
        firstContentfulPaint: 1500,
        largestContentfulPaint: 3000,
        totalBlockingTime: 200,
      };

      const result = await checkPerformanceBudget(mockUrl, "desktop", budget);

      expect(result.overallPassed).toBe(true);
    });

    it("should handle empty budget", async () => {
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(mockLighthouseResult);

      const result = await checkPerformanceBudget(mockUrl, "desktop", {});

      expect(result.overallPassed).toBe(true);
      expect(Object.keys(result.results)).toHaveLength(0);
    });
  });

  describe("getLcpOpportunities", () => {
    it("should return LCP optimization opportunities", async () => {
      const mockAudits: Record<string, any> = {
        "largest-contentful-paint": {
          numericValue: 3000, // 3 seconds
        },
      };

      // Create mock audits for LCP opportunities
      LCP_OPPORTUNITIES.forEach((auditId, index) => {
        mockAudits[auditId] = {
          title: `Opportunity ${index}`,
          description: `Description for ${auditId}`,
          score: index % 2 === 0 ? 0.5 : 0.8, // Mix of scores
          displayValue: `${index * 100}ms potential savings`,
          numericValue: index * 100,
        };
      });

      const mockLhr = {
        finalDisplayedUrl: mockUrl,
        fetchTime: mockFetchTime,
        audits: mockAudits,
      };

      vi.mocked(lighthouseCore.runRawLighthouseAudit).mockResolvedValue({
        lhr: mockLhr,
      } as any);

      const result = await getLcpOpportunities(mockUrl, "desktop", 2.5);

      expect(lighthouseCore.runRawLighthouseAudit).toHaveBeenCalledWith(mockUrl, ["performance"], "desktop");
      expect(result).toMatchObject({
        url: mockUrl,
        device: "desktop",
        lcpValue: 3.0,
        threshold: 2.5,
        needsImprovement: true,
        fetchTime: mockFetchTime,
      });

      expect(result.opportunities.length).toBeGreaterThan(0);
      expect(result.opportunities.every((opp: any) => opp.score < 1)).toBe(true);
    });

    it("should use default threshold", async () => {
      const mockLhr = {
        finalDisplayedUrl: mockUrl,
        fetchTime: mockFetchTime,
        audits: {
          "largest-contentful-paint": {
            numericValue: 2000,
          },
        },
      };

      vi.mocked(lighthouseCore.runRawLighthouseAudit).mockResolvedValue({
        lhr: mockLhr,
      } as any);

      const result = await getLcpOpportunities(mockUrl);

      expect(result.threshold).toBe(DEFAULTS.LCP_THRESHOLD);
      expect(result.lcpValue).toBe(2.0);
      expect(result.needsImprovement).toBe(false); // 2.0s <= 2.5s
    });

    it("should handle missing LCP audit", async () => {
      const mockLhr = {
        finalDisplayedUrl: mockUrl,
        fetchTime: mockFetchTime,
        audits: {},
      };

      vi.mocked(lighthouseCore.runRawLighthouseAudit).mockResolvedValue({
        lhr: mockLhr,
      } as any);

      const result = await getLcpOpportunities(mockUrl);

      expect(result.lcpValue).toBe(0);
      expect(result.needsImprovement).toBe(false);
      expect(result.opportunities).toEqual([]);
    });

    it("should filter opportunities with perfect scores", async () => {
      const mockAudits: Record<string, any> = {
        "largest-contentful-paint": {
          numericValue: 3000,
        },
        "render-blocking-resources": {
          title: "Render Blocking Resources",
          description: "Remove render-blocking resources",
          score: 1, // Perfect score - should be filtered out
          displayValue: "0ms potential savings",
          numericValue: 0,
        },
        "unused-css-rules": {
          title: "Unused CSS",
          description: "Remove unused CSS",
          score: 0.5, // Needs improvement - should be included
          displayValue: "200ms potential savings",
          numericValue: 200,
        },
      };

      const mockLhr = {
        finalDisplayedUrl: mockUrl,
        fetchTime: mockFetchTime,
        audits: mockAudits,
      };

      vi.mocked(lighthouseCore.runRawLighthouseAudit).mockResolvedValue({
        lhr: mockLhr,
      } as any);

      const result = await getLcpOpportunities(mockUrl);

      // Should only include the unused-css-rules audit (score < 1)
      expect(result.opportunities).toHaveLength(1);
      expect(result.opportunities[0]?.title).toBe("Unused CSS");
    });
  });
});
