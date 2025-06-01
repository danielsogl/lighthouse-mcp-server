// Chrome configuration constants
export const CHROME_FLAGS = ["--headless", "--no-sandbox", "--disable-dev-shm-usage"];

// Default screen dimensions
export const SCREEN_DIMENSIONS = {
  desktop: { width: 1350, height: 940 },
  mobile: { width: 360, height: 640 },
} as const;

// Throttling configuration
export const THROTTLING_CONFIG = {
  enabled: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4,
  },
  disabled: {
    rttMs: 0,
    throughputKbps: 10 * 1024,
    cpuSlowdownMultiplier: 1,
  },
} as const;

// Key performance metrics
export const KEY_METRICS = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
  "interactive",
] as const;

// LCP optimization opportunities
export const LCP_OPPORTUNITIES = [
  "render-blocking-resources",
  "unused-css-rules",
  "unused-javascript",
  "modern-image-formats",
  "uses-optimized-images",
  "efficient-animated-content",
  "preload-lcp-image",
  "uses-text-compression",
] as const;

// Security audit IDs
export const SECURITY_AUDITS = [
  "is-on-https",
  "uses-http2",
  "no-vulnerable-libraries",
  "csp-xss",
  "external-anchors-use-rel-noopener",
] as const;

// Performance budget metric mappings
export const BUDGET_METRIC_MAPPINGS = [
  { key: "firstContentfulPaint", metric: "first-contentful-paint", unit: "ms" },
  { key: "largestContentfulPaint", metric: "largest-contentful-paint", unit: "ms" },
  { key: "totalBlockingTime", metric: "total-blocking-time", unit: "ms" },
  { key: "cumulativeLayoutShift", metric: "cumulative-layout-shift", unit: "score" },
  { key: "speedIndex", metric: "speed-index", unit: "ms" },
] as const;

// Default values
export const DEFAULTS = {
  LCP_THRESHOLD: 2.5 as number,
  MIN_UNUSED_JS_BYTES: 2048 as number,
  MIN_RESOURCE_SIZE_KB: 0 as number,
};
