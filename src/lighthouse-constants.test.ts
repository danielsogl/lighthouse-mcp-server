import { describe, it, expect } from "vitest";
import {
  CHROME_FLAGS,
  SCREEN_DIMENSIONS,
  THROTTLING_CONFIG,
  KEY_METRICS,
  LCP_OPPORTUNITIES,
  SECURITY_AUDITS,
  BUDGET_METRIC_MAPPINGS,
  DEFAULTS,
} from "./lighthouse-constants";

describe("lighthouse-constants", () => {
  describe("CHROME_FLAGS", () => {
    it("should contain required Chrome flags", () => {
      expect(CHROME_FLAGS).toContain("--headless");
      expect(CHROME_FLAGS).toContain("--no-sandbox");
      expect(CHROME_FLAGS).toContain("--disable-dev-shm-usage");
    });

    it("should be an array", () => {
      expect(Array.isArray(CHROME_FLAGS)).toBe(true);
    });
  });

  describe("SCREEN_DIMENSIONS", () => {
    it("should have desktop and mobile dimensions", () => {
      expect(SCREEN_DIMENSIONS.desktop).toBeDefined();
      expect(SCREEN_DIMENSIONS.mobile).toBeDefined();
    });

    it("should have valid desktop dimensions", () => {
      expect(SCREEN_DIMENSIONS.desktop.width).toBe(1350);
      expect(SCREEN_DIMENSIONS.desktop.height).toBe(940);
    });

    it("should have valid mobile dimensions", () => {
      expect(SCREEN_DIMENSIONS.mobile.width).toBe(360);
      expect(SCREEN_DIMENSIONS.mobile.height).toBe(640);
    });

    it("should have numeric dimensions", () => {
      expect(typeof SCREEN_DIMENSIONS.desktop.width).toBe("number");
      expect(typeof SCREEN_DIMENSIONS.desktop.height).toBe("number");
      expect(typeof SCREEN_DIMENSIONS.mobile.width).toBe("number");
      expect(typeof SCREEN_DIMENSIONS.mobile.height).toBe("number");
    });
  });

  describe("THROTTLING_CONFIG", () => {
    it("should have enabled and disabled configurations", () => {
      expect(THROTTLING_CONFIG.enabled).toBeDefined();
      expect(THROTTLING_CONFIG.disabled).toBeDefined();
    });

    it("should have correct enabled throttling values", () => {
      expect(THROTTLING_CONFIG.enabled.rttMs).toBe(150);
      expect(THROTTLING_CONFIG.enabled.throughputKbps).toBe(1638.4);
      expect(THROTTLING_CONFIG.enabled.cpuSlowdownMultiplier).toBe(4);
    });

    it("should have correct disabled throttling values", () => {
      expect(THROTTLING_CONFIG.disabled.rttMs).toBe(0);
      expect(THROTTLING_CONFIG.disabled.throughputKbps).toBe(10240);
      expect(THROTTLING_CONFIG.disabled.cpuSlowdownMultiplier).toBe(1);
    });
  });

  describe("KEY_METRICS", () => {
    it("should contain expected performance metrics", () => {
      const expectedMetrics = [
        "first-contentful-paint",
        "largest-contentful-paint",
        "total-blocking-time",
        "cumulative-layout-shift",
        "speed-index",
        "interactive",
      ];

      expectedMetrics.forEach((metric) => {
        expect(KEY_METRICS).toContain(metric);
      });
    });

    it("should be a readonly array", () => {
      expect(Array.isArray(KEY_METRICS)).toBe(true);
    });
  });

  describe("LCP_OPPORTUNITIES", () => {
    it("should contain expected LCP optimization opportunities", () => {
      const expectedOpportunities = [
        "render-blocking-resources",
        "unused-css-rules",
        "unused-javascript",
        "modern-image-formats",
        "uses-optimized-images",
        "efficient-animated-content",
        "preload-lcp-image",
        "uses-text-compression",
      ];

      expectedOpportunities.forEach((opportunity) => {
        expect(LCP_OPPORTUNITIES).toContain(opportunity);
      });
    });
  });

  describe("SECURITY_AUDITS", () => {
    it("should contain expected security audit IDs", () => {
      const expectedAudits = [
        "is-on-https",
        "uses-http2",
        "no-vulnerable-libraries",
        "csp-xss",
        "external-anchors-use-rel-noopener",
      ];

      expectedAudits.forEach((audit) => {
        expect(SECURITY_AUDITS).toContain(audit);
      });
    });
  });

  describe("BUDGET_METRIC_MAPPINGS", () => {
    it("should have correct metric mappings structure", () => {
      BUDGET_METRIC_MAPPINGS.forEach((mapping) => {
        expect(mapping).toHaveProperty("key");
        expect(mapping).toHaveProperty("metric");
        expect(mapping).toHaveProperty("unit");
        expect(typeof mapping.key).toBe("string");
        expect(typeof mapping.metric).toBe("string");
        expect(typeof mapping.unit).toBe("string");
      });
    });

    it("should contain expected metric mappings", () => {
      const keys = BUDGET_METRIC_MAPPINGS.map((m) => m.key);
      expect(keys).toContain("firstContentfulPaint");
      expect(keys).toContain("largestContentfulPaint");
      expect(keys).toContain("totalBlockingTime");
      expect(keys).toContain("cumulativeLayoutShift");
      expect(keys).toContain("speedIndex");
    });
  });

  describe("DEFAULTS", () => {
    it("should have correct default values", () => {
      expect(DEFAULTS.LCP_THRESHOLD).toBe(2.5);
      expect(DEFAULTS.MIN_UNUSED_JS_BYTES).toBe(2048);
      expect(DEFAULTS.MIN_RESOURCE_SIZE_KB).toBe(0);
    });

    it("should have numeric default values", () => {
      expect(typeof DEFAULTS.LCP_THRESHOLD).toBe("number");
      expect(typeof DEFAULTS.MIN_UNUSED_JS_BYTES).toBe("number");
      expect(typeof DEFAULTS.MIN_RESOURCE_SIZE_KB).toBe("number");
    });
  });
});
