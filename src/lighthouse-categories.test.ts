/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAccessibilityScore, getSeoAnalysis, checkPwaReadiness } from "./lighthouse-categories";
import * as lighthouseCore from "./lighthouse-core";

// Mock the lighthouse-core module
vi.mock("./lighthouse-core", () => ({
  runLighthouseAudit: vi.fn(),
  getDetailedAuditResults: vi.fn(),
}));

describe("lighthouse-categories", () => {
  const mockUrl = "https://example.com";
  const mockFetchTime = "2024-01-01T00:00:00.000Z";

  const mockLighthouseResult = {
    url: mockUrl,
    device: "desktop" as const,
    fetchTime: mockFetchTime,
    version: "12.0.0",
    userAgent: "Test Agent",
    categories: {
      accessibility: { title: "Accessibility", score: 85, description: "Accessibility category" },
      seo: { title: "SEO", score: 92, description: "SEO category" },
      pwa: { title: "PWA", score: 67, description: "PWA category" },
    },
    metrics: {},
  };

  const mockDetailedAudits = [
    {
      id: "aria-labels",
      title: "ARIA Labels",
      description: "Elements have accessible labels",
      score: 0.8,
      scoreDisplayMode: "binary",
      displayValue: "8 issues found",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAccessibilityScore", () => {
    it("should return accessibility score without details", async () => {
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(mockLighthouseResult);

      const result = await getAccessibilityScore(mockUrl);

      expect(lighthouseCore.runLighthouseAudit).toHaveBeenCalledWith(mockUrl, ["accessibility"], "desktop");
      expect(result).toEqual({
        url: mockUrl,
        device: "desktop",
        accessibilityScore: 85,
        fetchTime: mockFetchTime,
      });
    });

    it("should return accessibility score with details when requested", async () => {
      const mobileResult = { ...mockLighthouseResult, device: "mobile" as const };
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(mobileResult);
      vi.mocked(lighthouseCore.getDetailedAuditResults).mockResolvedValue({
        lhr: {} as any,
        audits: mockDetailedAudits,
      });

      const result = await getAccessibilityScore(mockUrl, "mobile", true);

      expect(lighthouseCore.runLighthouseAudit).toHaveBeenCalledWith(mockUrl, ["accessibility"], "mobile");
      expect(lighthouseCore.getDetailedAuditResults).toHaveBeenCalledWith(mockUrl, "accessibility", "mobile");
      expect(result).toEqual({
        url: mockUrl,
        device: "mobile",
        accessibilityScore: 85,
        fetchTime: mockFetchTime,
        audits: mockDetailedAudits,
      });
    });

    it("should handle missing accessibility category", async () => {
      const resultWithoutAccessibility = {
        ...mockLighthouseResult,
        categories: {},
      };
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(resultWithoutAccessibility);

      const result = await getAccessibilityScore(mockUrl);

      expect(result.accessibilityScore).toBe(0);
    });

    it("should use default device parameter", async () => {
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(mockLighthouseResult);

      await getAccessibilityScore(mockUrl);

      expect(lighthouseCore.runLighthouseAudit).toHaveBeenCalledWith(mockUrl, ["accessibility"], "desktop");
    });
  });

  describe("getSeoAnalysis", () => {
    it("should return SEO score without details", async () => {
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(mockLighthouseResult);

      const result = await getSeoAnalysis(mockUrl);

      expect(lighthouseCore.runLighthouseAudit).toHaveBeenCalledWith(mockUrl, ["seo"], "desktop");
      expect(result).toEqual({
        url: mockUrl,
        device: "desktop",
        seoScore: 92,
        fetchTime: mockFetchTime,
      });
    });

    it("should return SEO score with details when requested", async () => {
      const mobileResult = { ...mockLighthouseResult, device: "mobile" as const };
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(mobileResult);
      vi.mocked(lighthouseCore.getDetailedAuditResults).mockResolvedValue({
        lhr: {} as any,
        audits: mockDetailedAudits,
      });

      const result = await getSeoAnalysis(mockUrl, "mobile", true);

      expect(lighthouseCore.runLighthouseAudit).toHaveBeenCalledWith(mockUrl, ["seo"], "mobile");
      expect(lighthouseCore.getDetailedAuditResults).toHaveBeenCalledWith(mockUrl, "seo", "mobile");
      expect(result).toEqual({
        url: mockUrl,
        device: "mobile",
        seoScore: 92,
        fetchTime: mockFetchTime,
        audits: mockDetailedAudits,
      });
    });

    it("should handle missing SEO category", async () => {
      const resultWithoutSeo = {
        ...mockLighthouseResult,
        categories: {},
      };
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(resultWithoutSeo);

      const result = await getSeoAnalysis(mockUrl);

      expect(result.seoScore).toBe(0);
    });
  });

  describe("checkPwaReadiness", () => {
    it("should return PWA score without details", async () => {
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(mockLighthouseResult);

      const result = await checkPwaReadiness(mockUrl);

      expect(lighthouseCore.runLighthouseAudit).toHaveBeenCalledWith(mockUrl, ["pwa"], "desktop");
      expect(result).toEqual({
        url: mockUrl,
        device: "desktop",
        pwaScore: 67,
        fetchTime: mockFetchTime,
      });
    });

    it("should return PWA score with details when requested", async () => {
      const mobileResult = { ...mockLighthouseResult, device: "mobile" as const };
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(mobileResult);
      vi.mocked(lighthouseCore.getDetailedAuditResults).mockResolvedValue({
        lhr: {} as any,
        audits: mockDetailedAudits,
      });

      const result = await checkPwaReadiness(mockUrl, "mobile", true);

      expect(lighthouseCore.runLighthouseAudit).toHaveBeenCalledWith(mockUrl, ["pwa"], "mobile");
      expect(lighthouseCore.getDetailedAuditResults).toHaveBeenCalledWith(mockUrl, "pwa", "mobile");
      expect(result).toEqual({
        url: mockUrl,
        device: "mobile",
        pwaScore: 67,
        fetchTime: mockFetchTime,
        audits: mockDetailedAudits,
      });
    });

    it("should handle missing PWA category", async () => {
      const resultWithoutPwa = {
        ...mockLighthouseResult,
        categories: {},
      };
      vi.mocked(lighthouseCore.runLighthouseAudit).mockResolvedValue(resultWithoutPwa);

      const result = await checkPwaReadiness(mockUrl);

      expect(result.pwaScore).toBe(0);
    });
  });
});
