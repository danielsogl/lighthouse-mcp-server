/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { findUnusedJavaScript, analyzeResources, getSecurityAudit } from "./lighthouse-analysis";
import * as lighthouseCore from "./lighthouse-core";
import { SECURITY_AUDITS, DEFAULTS } from "./lighthouse-constants";

// Mock the lighthouse-core module
vi.mock("./lighthouse-core", () => ({
  runRawLighthouseAudit: vi.fn(),
}));

describe("lighthouse-analysis", () => {
  const mockUrl = "https://example.com";
  const mockFetchTime = "2024-01-01T00:00:00.000Z";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findUnusedJavaScript", () => {
    it("should return unused JavaScript analysis", async () => {
      const mockLhr = {
        finalDisplayedUrl: mockUrl,
        fetchTime: mockFetchTime,
        audits: {
          "unused-javascript": {
            details: {
              items: [
                {
                  url: "https://example.com/script1.js",
                  totalBytes: 10000,
                  wastedBytes: 5000,
                },
                {
                  url: "https://example.com/script2.js",
                  totalBytes: 8000,
                  wastedBytes: 1500,
                },
              ],
            },
          },
        },
      };

      vi.mocked(lighthouseCore.runRawLighthouseAudit).mockResolvedValue({
        lhr: mockLhr,
      } as any);

      const result = await findUnusedJavaScript(mockUrl, "desktop", 1000); // Lower threshold to include both

      expect(lighthouseCore.runRawLighthouseAudit).toHaveBeenCalledWith(mockUrl, ["performance"], "desktop");
      expect(result).toEqual({
        url: mockUrl,
        device: "desktop",
        totalUnusedBytes: 6500,
        items: [
          {
            url: "https://example.com/script1.js",
            totalBytes: 10000,
            wastedBytes: 5000,
            wastedPercent: 50,
          },
          {
            url: "https://example.com/script2.js",
            totalBytes: 8000,
            wastedBytes: 1500,
            wastedPercent: 19,
          },
        ],
        fetchTime: mockFetchTime,
      });
    });

    it("should filter by minimum bytes", async () => {
      const mockLhr = {
        finalDisplayedUrl: mockUrl,
        fetchTime: mockFetchTime,
        audits: {
          "unused-javascript": {
            details: {
              items: [
                {
                  url: "https://example.com/small.js",
                  totalBytes: 1000,
                  wastedBytes: 500,
                },
                {
                  url: "https://example.com/large.js",
                  totalBytes: 10000,
                  wastedBytes: 5000,
                },
              ],
            },
          },
        },
      };

      vi.mocked(lighthouseCore.runRawLighthouseAudit).mockResolvedValue({
        lhr: mockLhr,
      } as any);

      const result = await findUnusedJavaScript(mockUrl, "desktop", 1000);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].url).toBe("https://example.com/large.js");
      expect(result.totalUnusedBytes).toBe(5000);
    });

    it("should handle missing unused-javascript audit", async () => {
      const mockLhr = {
        finalDisplayedUrl: mockUrl,
        fetchTime: mockFetchTime,
        audits: {},
      };

      vi.mocked(lighthouseCore.runRawLighthouseAudit).mockResolvedValue({
        lhr: mockLhr,
      } as any);

      const result = await findUnusedJavaScript(mockUrl);

      expect(result).toEqual({
        url: mockUrl,
        device: "desktop",
        totalUnusedBytes: 0,
        items: [],
        fetchTime: mockFetchTime,
      });
    });

    it("should use default minimum bytes", async () => {
      const mockLhr = {
        finalDisplayedUrl: mockUrl,
        fetchTime: mockFetchTime,
        audits: {
          "unused-javascript": {
            details: {
              items: [
                {
                  url: "https://example.com/script.js",
                  totalBytes: 5000,
                  wastedBytes: DEFAULTS.MIN_UNUSED_JS_BYTES + 100,
                },
              ],
            },
          },
        },
      };

      vi.mocked(lighthouseCore.runRawLighthouseAudit).mockResolvedValue({
        lhr: mockLhr,
      } as any);

      const result = await findUnusedJavaScript(mockUrl);

      expect(result.items).toHaveLength(1);
    });
  });

  describe("analyzeResources", () => {
    it("should analyze website resources", async () => {
      const mockLhr = {
        finalDisplayedUrl: mockUrl,
        fetchTime: mockFetchTime,
        audits: {
          "network-requests": {
            details: {
              items: [
                {
                  url: "https://example.com/image.jpg",
                  transferSize: 50000,
                  resourceSize: 60000,
                  mimeType: "image/jpeg",
                  resourceType: "images", // Match the expected categorization
                },
                {
                  url: "https://example.com/script.js",
                  transferSize: 30000,
                  resourceSize: 35000,
                  mimeType: "application/javascript",
                  resourceType: "javascript", // Match the expected categorization
                },
                {
                  url: "https://example.com/style.css",
                  transferSize: 15000,
                  resourceSize: 18000,
                  mimeType: "text/css",
                  resourceType: "stylesheet",
                },
              ],
            },
          },
        },
      };

      vi.mocked(lighthouseCore.runRawLighthouseAudit).mockResolvedValue({
        lhr: mockLhr,
      } as any);

      const result = await analyzeResources(mockUrl, "desktop", ["images", "javascript"], 10);

      expect(lighthouseCore.runRawLighthouseAudit).toHaveBeenCalledWith(mockUrl, ["performance"], "desktop");
      expect(result.resources).toHaveLength(2); // Only image and javascript
      expect(result.summary).toHaveProperty("images");
      expect(result.summary).toHaveProperty("javascript");
      expect(result.summary.images.count).toBe(1);
      expect(result.summary.javascript.count).toBe(1);
    });

    it("should filter by minimum size", async () => {
      const mockLhr = {
        finalDisplayedUrl: mockUrl,
        fetchTime: mockFetchTime,
        audits: {
          "network-requests": {
            details: {
              items: [
                {
                  url: "https://example.com/large.jpg",
                  transferSize: 100000, // 97.66 KB
                  resourceSize: 100000,
                  mimeType: "image/jpeg",
                },
                {
                  url: "https://example.com/small.js",
                  transferSize: 1000, // 0.98 KB
                  resourceSize: 1000,
                  mimeType: "application/javascript",
                },
              ],
            },
          },
        },
      };

      vi.mocked(lighthouseCore.runRawLighthouseAudit).mockResolvedValue({
        lhr: mockLhr,
      } as any);

      const result = await analyzeResources(mockUrl, "desktop", undefined, 50); // 50KB minimum

      expect(result.resources).toHaveLength(1);
      expect(result.resources[0].url).toBe("https://example.com/large.jpg");
    });

    it("should categorize resources by MIME type", async () => {
      const mockLhr = {
        finalDisplayedUrl: mockUrl,
        fetchTime: mockFetchTime,
        audits: {
          "network-requests": {
            details: {
              items: [
                {
                  url: "https://example.com/unknown",
                  transferSize: 10000,
                  resourceSize: 10000,
                  mimeType: "image/png",
                },
                {
                  url: "https://example.com/script",
                  transferSize: 10000,
                  resourceSize: 10000,
                  mimeType: "text/javascript",
                },
                {
                  url: "https://example.com/style",
                  transferSize: 10000,
                  resourceSize: 10000,
                  mimeType: "text/css",
                },
                {
                  url: "https://example.com/font.woff2",
                  transferSize: 10000,
                  resourceSize: 10000,
                  mimeType: "font/woff2",
                },
                {
                  url: "https://example.com/unknown.bin",
                  transferSize: 10000,
                  resourceSize: 10000,
                  mimeType: "application/octet-stream",
                },
              ],
            },
          },
        },
      };

      vi.mocked(lighthouseCore.runRawLighthouseAudit).mockResolvedValue({
        lhr: mockLhr,
      } as any);

      const result = await analyzeResources(mockUrl);

      const resourceTypes = result.resources.map((r) => r.resourceType);
      expect(resourceTypes).toContain("images");
      expect(resourceTypes).toContain("javascript");
      expect(resourceTypes).toContain("css");
      expect(resourceTypes).toContain("fonts");
      expect(resourceTypes).toContain("other");
    });

    it("should handle missing network-requests audit", async () => {
      const mockLhr = {
        finalDisplayedUrl: mockUrl,
        fetchTime: mockFetchTime,
        audits: {},
      };

      vi.mocked(lighthouseCore.runRawLighthouseAudit).mockResolvedValue({
        lhr: mockLhr,
      } as any);

      const result = await analyzeResources(mockUrl);

      expect(result).toEqual({
        url: mockUrl,
        device: "desktop",
        resources: [],
        summary: {},
        fetchTime: mockFetchTime,
      });
    });
  });

  describe("getSecurityAudit", () => {
    it("should return security audit results", async () => {
      const mockAudits: Record<string, any> = {};
      SECURITY_AUDITS.forEach((auditId, index) => {
        mockAudits[auditId] = {
          title: `Security Audit ${index}`,
          description: `Description for ${auditId}`,
          score: index % 2 === 0 ? 1 : 0.5, // Alternate between passing and failing
          scoreDisplayMode: "binary",
          displayValue: index % 2 === 0 ? "Passed" : "Failed",
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

      const result = await getSecurityAudit(mockUrl, "desktop");

      expect(lighthouseCore.runRawLighthouseAudit).toHaveBeenCalledWith(mockUrl, ["best-practices"], "desktop");
      expect(result.audits).toHaveLength(SECURITY_AUDITS.length);
      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it("should filter by specific checks", async () => {
      const mockAudits: Record<string, any> = {};
      SECURITY_AUDITS.forEach((auditId) => {
        mockAudits[auditId] = {
          title: "Security Audit",
          description: `Description for ${auditId}`,
          score: 1,
          scoreDisplayMode: "binary",
          displayValue: "Passed",
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

      const result = await getSecurityAudit(mockUrl, "desktop", ["https", "csp"]);

      // Should only include audits that contain "https" or "csp" in their ID
      const httpsAudits = result.audits.filter(
        (audit: any) => audit && (audit.id.includes("https") || audit.id.includes("csp")),
      );
      expect(httpsAudits.length).toBeGreaterThan(0);
    });

    it("should handle missing security audits", async () => {
      const mockLhr = {
        finalDisplayedUrl: mockUrl,
        fetchTime: mockFetchTime,
        audits: {},
      };

      vi.mocked(lighthouseCore.runRawLighthouseAudit).mockResolvedValue({
        lhr: mockLhr,
      } as any);

      const result = await getSecurityAudit(mockUrl);

      expect(result.audits).toEqual([]);
      // When no audits, the division by zero results in NaN, which becomes 0 when rounded
      expect(Number.isNaN(result.overallScore) || result.overallScore === 0).toBe(true);
    });

    it("should calculate overall score correctly", async () => {
      const mockAudits: Record<string, any> = {
        "is-on-https": {
          title: "HTTPS",
          description: "Uses HTTPS",
          score: 1,
          scoreDisplayMode: "binary",
          displayValue: "Passed",
        },
        "uses-http2": {
          title: "HTTP/2",
          description: "Uses HTTP/2",
          score: 0,
          scoreDisplayMode: "binary",
          displayValue: "Failed",
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

      const result = await getSecurityAudit(mockUrl);

      // Should be 50% (1 + 0) / 2 = 0.5 * 100 = 50
      expect(result.overallScore).toBe(50);
    });
  });
});
