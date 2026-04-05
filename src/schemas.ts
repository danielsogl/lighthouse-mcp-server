import { z } from "zod";

// Enhanced URL validation with security checks
const urlValidator = z
  .string()
  .describe("URL to audit")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        // Only allow HTTP and HTTPS protocols
        return ["http:", "https:"].includes(parsed.protocol);
      } catch {
        return false;
      }
    },
    {
      message: "Must be a valid HTTP or HTTPS URL",
    },
  );

// Reusable base schema components
export const baseSchemas = {
  url: urlValidator,
  device: z.enum(["desktop", "mobile"]).describe("Device to emulate (default: desktop)").default("desktop"),
  throttling: z.boolean().describe("Whether to throttle the audit (default: false)").default(false),
  categories: z
    .array(z.enum(["performance", "accessibility", "best-practices", "seo", "pwa"]).describe("Categories to audit"))
    .optional(),
  includeDetails: z.boolean().describe("Include detailed metrics and recommendations").default(false),
  threshold: z.number().describe("Score threshold (0-100)").min(0).max(100).optional(),
};

// Composed schemas for each tool (wrapped in z.object() for proper type inference)
export const auditParamsSchema = z.object({
  url: baseSchemas.url,
  categories: baseSchemas.categories,
  device: baseSchemas.device,
  throttling: baseSchemas.throttling,
});

export const basicAuditSchema = z.object({
  url: baseSchemas.url,
  device: baseSchemas.device,
});

export const detailedAuditSchema = z.object({
  url: baseSchemas.url,
  device: baseSchemas.device,
  includeDetails: baseSchemas.includeDetails,
});

export const coreWebVitalsSchema = z.object({
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
});

export const performanceBudgetSchema = z.object({
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
});

export const compareDevicesSchema = z.object({
  url: baseSchemas.url,
  categories: baseSchemas.categories,
  throttling: baseSchemas.throttling,
  includeDetails: baseSchemas.includeDetails,
});

export const resourceAnalysisSchema = z.object({
  url: baseSchemas.url,
  device: baseSchemas.device,
  resourceTypes: z
    .array(z.enum(["images", "javascript", "css", "fonts", "other"]))
    .optional()
    .describe("Types of resources to analyze"),
  minSize: z.number().min(0).optional().describe("Minimum resource size in KB to include"),
});

export const lcpOpportunitiesSchema = z.object({
  url: baseSchemas.url,
  device: baseSchemas.device,
  includeDetails: baseSchemas.includeDetails,
  threshold: z.number().min(0).optional().describe("LCP threshold in seconds (default: 2.5)"),
});

export const unusedJavaScriptSchema = z.object({
  url: baseSchemas.url,
  device: baseSchemas.device,
  minBytes: z.number().min(0).default(2048).describe("Minimum unused bytes to report (default: 2048)"),
});

export const securityAuditSchema = z.object({
  url: baseSchemas.url,
  device: baseSchemas.device,
  checks: z
    .array(z.enum(["https", "mixed-content", "csp", "hsts", "vulnerabilities"]))
    .optional()
    .describe("Specific security checks to perform"),
});
