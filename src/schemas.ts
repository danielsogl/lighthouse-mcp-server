import { z } from "zod";

// Reusable base schema components
export const baseSchemas = {
  url: z.string({ description: "URL to audit" }),
  device: z.enum(["desktop", "mobile"], { description: "Device to emulate (default: desktop)" }).default("desktop"),
  throttling: z.boolean({ description: "Whether to throttle the audit (default: false)" }).default(false),
  categories: z
    .array(
      z.enum(["performance", "accessibility", "best-practices", "seo", "pwa"], {
        description: "Categories to audit",
      }),
    )
    .optional(),
  includeDetails: z.boolean({ description: "Include detailed metrics and recommendations" }).default(false),
  threshold: z.number({ description: "Score threshold (0-100)" }).min(0).max(100).optional(),
};

// Composed schemas for each tool
export const auditParamsSchema = {
  url: baseSchemas.url,
  categories: baseSchemas.categories,
  device: baseSchemas.device,
  throttling: baseSchemas.throttling,
};

export const basicAuditSchema = {
  url: baseSchemas.url,
  device: baseSchemas.device,
};

export const detailedAuditSchema = {
  url: baseSchemas.url,
  device: baseSchemas.device,
  includeDetails: baseSchemas.includeDetails,
};

export const coreWebVitalsSchema = {
  url: baseSchemas.url,
  device: baseSchemas.device,
  includeDetails: baseSchemas.includeDetails,
  threshold: z
    .object({
      lcp: z.number().min(0).optional().describe("Largest Contentful Paint threshold in seconds"),
      fid: z.number().min(0).optional().describe("First Input Delay threshold in milliseconds"),
      cls: z.number().min(0).optional().describe("Cumulative Layout Shift threshold"),
    })
    .optional(),
};

export const performanceBudgetSchema = {
  url: baseSchemas.url,
  device: baseSchemas.device,
  budget: z.object({
    performanceScore: baseSchemas.threshold,
    firstContentfulPaint: z.number().min(0).optional().describe("FCP budget in milliseconds"),
    largestContentfulPaint: z.number().min(0).optional().describe("LCP budget in milliseconds"),
    totalBlockingTime: z.number().min(0).optional().describe("TBT budget in milliseconds"),
    cumulativeLayoutShift: z.number().min(0).optional().describe("CLS budget"),
    speedIndex: z.number().min(0).optional().describe("Speed Index budget in milliseconds"),
  }),
};

export const compareDevicesSchema = {
  url: baseSchemas.url,
  categories: baseSchemas.categories,
  throttling: baseSchemas.throttling,
  includeDetails: baseSchemas.includeDetails,
};

export const resourceAnalysisSchema = {
  url: baseSchemas.url,
  device: baseSchemas.device,
  resourceTypes: z
    .array(z.enum(["images", "javascript", "css", "fonts", "other"]))
    .optional()
    .describe("Types of resources to analyze"),
  minSize: z.number().min(0).optional().describe("Minimum resource size in KB to include"),
};

export const lcpOpportunitiesSchema = {
  url: baseSchemas.url,
  device: baseSchemas.device,
  includeDetails: baseSchemas.includeDetails,
  threshold: z.number().min(0).optional().describe("LCP threshold in seconds (default: 2.5)"),
};

export const unusedJavaScriptSchema = {
  url: baseSchemas.url,
  device: baseSchemas.device,
  minBytes: z.number().min(0).default(2048).describe("Minimum unused bytes to report (default: 2048)"),
  includeSourceMaps: z.boolean().default(false).describe("Include source map analysis"),
};

export const securityAuditSchema = {
  url: baseSchemas.url,
  device: baseSchemas.device,
  checks: z
    .array(z.enum(["https", "mixed-content", "csp", "hsts", "vulnerabilities"]))
    .optional()
    .describe("Specific security checks to perform"),
};
