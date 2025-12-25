/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import {
  getScreenEmulation,
  buildLighthouseOptions,
  filterAuditsByCategory,
  formatCategoryScores,
  extractKeyMetrics,
} from "./lighthouse-core";
import { SCREEN_DIMENSIONS } from "./lighthouse-constants";

describe("lighthouse-core utilities", () => {
  describe("getScreenEmulation", () => {
    it("should return desktop screen emulation settings", () => {
      const result = getScreenEmulation("desktop");

      expect(result).toEqual({
        mobile: false,
        width: SCREEN_DIMENSIONS.desktop.width,
        height: SCREEN_DIMENSIONS.desktop.height,
        deviceScaleFactor: 1,
        disabled: false,
      });
    });

    it("should return mobile screen emulation settings", () => {
      const result = getScreenEmulation("mobile");

      expect(result).toEqual({
        mobile: true,
        width: SCREEN_DIMENSIONS.mobile.width,
        height: SCREEN_DIMENSIONS.mobile.height,
        deviceScaleFactor: 1,
        disabled: false,
      });
    });
  });

  describe("buildLighthouseOptions", () => {
    it("should build options with default settings", () => {
      const port = 9222;
      const device = "desktop";

      const options = buildLighthouseOptions(port, device);

      expect(options).toMatchObject({
        logLevel: "info",
        output: "json",
        port: 9222,
        formFactor: "desktop",
        onlyCategories: undefined,
      });

      expect(options.screenEmulation).toEqual(getScreenEmulation("desktop"));
    });

    it("should build options with categories", () => {
      const port = 9222;
      const device = "mobile";
      const categories = ["performance", "accessibility"];

      const options = buildLighthouseOptions(port, device, categories);

      expect(options.onlyCategories).toEqual(categories);
      expect(options.formFactor).toBe("mobile");
    });

    it("should configure throttling when enabled", () => {
      const port = 9222;
      const device = "desktop";
      const throttling = true;

      const options = buildLighthouseOptions(port, device, undefined, throttling);

      expect(options.throttling).toMatchObject({
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4,
      });
    });

    it("should disable throttling when disabled", () => {
      const port = 9222;
      const device = "desktop";
      const throttling = false;

      const options = buildLighthouseOptions(port, device, undefined, throttling);

      expect(options.throttling).toMatchObject({
        rttMs: 0,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
      });
    });

    it("should set disableStorageReset when enabled", () => {
      const options = buildLighthouseOptions(9222, "desktop", undefined, false, true);

      expect(options.disableStorageReset).toBe(true);
    });
  });

  describe("filterAuditsByCategory", () => {
    it("should filter audits by category", () => {
      const mockLhr = {
        audits: {
          "first-contentful-paint": {
            title: "First Contentful Paint",
            description: "FCP description",
            score: 0.9,
            scoreDisplayMode: "numeric",
            displayValue: "1.2 s",
          },
          "largest-contentful-paint": {
            title: "Largest Contentful Paint",
            description: "LCP description",
            score: 0.8,
            scoreDisplayMode: "numeric",
            displayValue: "2.5 s",
          },
          "unused-css-rules": {
            title: "Unused CSS",
            description: "CSS description",
            score: 0.7,
            scoreDisplayMode: "binary",
            displayValue: "Remove unused CSS",
          },
        },
        categories: {
          performance: {
            auditRefs: [{ id: "first-contentful-paint" }, { id: "largest-contentful-paint" }],
          },
        },
      } as any;

      const result = filterAuditsByCategory(mockLhr, "performance");

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: "first-contentful-paint",
        title: "First Contentful Paint",
        description: "FCP description",
        score: 0.9,
      });
      expect(result[1]).toMatchObject({
        id: "largest-contentful-paint",
        title: "Largest Contentful Paint",
        description: "LCP description",
        score: 0.8,
      });
    });

    it("should return empty array for non-existent category", () => {
      const mockLhr = {
        audits: {},
        categories: {},
      } as any;

      const result = filterAuditsByCategory(mockLhr, "non-existent");

      expect(result).toEqual([]);
    });
  });

  describe("formatCategoryScores", () => {
    it("should format category scores correctly", () => {
      const mockLhr = {
        categories: {
          performance: {
            title: "Performance",
            description: "Performance category",
            score: 0.92,
          },
          accessibility: {
            title: "Accessibility",
            description: "Accessibility category",
            score: 0.85,
          },
          "best-practices": {
            title: "Best Practices",
            description: "Best practices category",
            score: null,
          },
        },
      } as any;

      const result = formatCategoryScores(mockLhr);

      expect(result).toEqual({
        performance: {
          title: "Performance",
          score: 92,
          description: "Performance category",
        },
        accessibility: {
          title: "Accessibility",
          score: 85,
          description: "Accessibility category",
        },
        "best-practices": {
          title: "Best Practices",
          score: 0,
          description: "Best practices category",
        },
      });
    });
  });

  describe("extractKeyMetrics", () => {
    it("should extract key metrics from LHR audits", () => {
      const mockLhr = {
        audits: {
          "first-contentful-paint": {
            title: "First Contentful Paint",
            numericValue: 1200,
            displayValue: "1.2 s",
            score: 0.9,
          },
          "largest-contentful-paint": {
            title: "Largest Contentful Paint",
            numericValue: 2500,
            displayValue: "2.5 s",
            score: 0.8,
          },
          "cumulative-layout-shift": {
            title: "Cumulative Layout Shift",
            numericValue: 0.05,
            displayValue: "0.05",
            score: 0.95,
          },
          "non-key-metric": {
            title: "Non Key Metric",
            numericValue: 100,
            displayValue: "100ms",
            score: 0.5,
          },
        },
      } as any;

      const result = extractKeyMetrics(mockLhr);

      expect(result).toHaveProperty("first-contentful-paint");
      expect(result).toHaveProperty("largest-contentful-paint");
      expect(result).toHaveProperty("cumulative-layout-shift");
      expect(result).not.toHaveProperty("non-key-metric");

      expect(result["first-contentful-paint"]).toEqual({
        title: "First Contentful Paint",
        value: 1200,
        displayValue: "1.2 s",
        score: 90,
      });
    });

    it("should handle missing audits gracefully", () => {
      const mockLhr = {
        audits: {},
      } as any;

      const result = extractKeyMetrics(mockLhr);

      expect(result).toEqual({});
    });

    it("should handle null scores", () => {
      const mockLhr = {
        audits: {
          "first-contentful-paint": {
            title: "First Contentful Paint",
            numericValue: 1200,
            displayValue: "1.2 s",
            score: null,
          },
        },
      } as any;

      const result = extractKeyMetrics(mockLhr);

      expect(result["first-contentful-paint"].score).toBeNull();
    });

    it("should handle missing numeric values and display values", () => {
      const mockLhr = {
        audits: {
          "first-contentful-paint": {
            title: "First Contentful Paint",
            score: 0.5,
          },
        },
      } as any;

      const result = extractKeyMetrics(mockLhr);

      expect(result["first-contentful-paint"]).toEqual({
        title: "First Contentful Paint",
        value: 0,
        displayValue: "N/A",
        score: 50,
      });
    });

    it("should handle null audits object", () => {
      const mockLhr = {
        audits: null,
      } as any;

      const result = extractKeyMetrics(mockLhr);

      expect(result).toEqual({});
    });

    it("should handle undefined audits object", () => {
      const mockLhr = {} as any;

      const result = extractKeyMetrics(mockLhr);

      expect(result).toEqual({});
    });
  });

  describe("filterAuditsByCategory edge cases", () => {
    it("should handle category with no auditRefs", () => {
      const mockLhr = {
        audits: {
          "some-audit": {
            title: "Some Audit",
            description: "Description",
            score: 1,
            scoreDisplayMode: "binary",
            displayValue: "Passed",
          },
        },
        categories: {
          performance: {
            title: "Performance",
            description: "Performance category",
            score: 0.9,
          },
        },
      } as any;

      const result = filterAuditsByCategory(mockLhr, "performance");

      expect(result).toEqual([]);
    });

    it("should handle missing category", () => {
      const mockLhr = {
        audits: {
          "some-audit": {
            title: "Some Audit",
            description: "Description",
            score: 1,
            scoreDisplayMode: "binary",
            displayValue: "Passed",
          },
        },
        categories: {},
      } as any;

      const result = filterAuditsByCategory(mockLhr, "missing-category");

      expect(result).toEqual([]);
    });
  });
});
