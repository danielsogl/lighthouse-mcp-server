import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create an MCP server
const server = new McpServer({
  name: "Lighthouse",
  version: "1.0.0",
});

// Reusable base schema components
const baseSchemas = {
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
const auditParamsSchema = {
  url: baseSchemas.url,
  categories: baseSchemas.categories,
  device: baseSchemas.device,
  throttling: baseSchemas.throttling,
};

const basicAuditSchema = {
  url: baseSchemas.url,
  device: baseSchemas.device,
};

const detailedAuditSchema = {
  url: baseSchemas.url,
  device: baseSchemas.device,
  includeDetails: baseSchemas.includeDetails,
};

const coreWebVitalsSchema = {
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

const performanceBudgetSchema = {
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

const compareDevicesSchema = {
  url: baseSchemas.url,
  categories: baseSchemas.categories,
  throttling: baseSchemas.throttling,
  includeDetails: baseSchemas.includeDetails,
};

const resourceAnalysisSchema = {
  url: baseSchemas.url,
  device: baseSchemas.device,
  resourceTypes: z
    .array(z.enum(["images", "javascript", "css", "fonts", "other"]))
    .optional()
    .describe("Types of resources to analyze"),
  minSize: z.number().min(0).optional().describe("Minimum resource size in KB to include"),
};

const lcpOpportunitiesSchema = {
  url: baseSchemas.url,
  device: baseSchemas.device,
  includeDetails: baseSchemas.includeDetails,
  threshold: z.number().min(0).optional().describe("LCP threshold in seconds (default: 2.5)"),
};

const unusedJavaScriptSchema = {
  url: baseSchemas.url,
  device: baseSchemas.device,
  minBytes: z.number().min(0).default(2048).describe("Minimum unused bytes to report (default: 2048)"),
  includeSourceMaps: z.boolean().default(false).describe("Include source map analysis"),
};

const securityAuditSchema = {
  url: baseSchemas.url,
  device: baseSchemas.device,
  checks: z
    .array(z.enum(["https", "mixed-content", "csp", "hsts", "vulnerabilities"]))
    .optional()
    .describe("Specific security checks to perform"),
};

// Tool implementations
server.tool(
  "run_audit",
  "Run a comprehensive Lighthouse audit on a website",
  auditParamsSchema,
  async ({ url, categories, device, throttling }) => ({
    content: [
      {
        type: "text",
        text: `Auditing ${url} with categories ${categories?.join(", ") || "all"} on ${device} with throttling ${throttling}`,
      },
    ],
  }),
);

server.tool(
  "get_performance_score",
  "Get the performance score for a website",
  basicAuditSchema,
  async ({ url, device }) => ({
    content: [{ type: "text", text: `Performance score for ${url} on ${device}` }],
  }),
);

server.tool(
  "get_core_web_vitals",
  "Get Core Web Vitals metrics for a website",
  coreWebVitalsSchema,
  async ({ url, device, includeDetails, threshold }) => ({
    content: [
      {
        type: "text",
        text: `Core Web Vitals for ${url} on ${device}${includeDetails ? " (detailed)" : ""}${threshold ? " with custom thresholds" : ""}`,
      },
    ],
  }),
);

server.tool(
  "get_accessibility_score",
  "Get the accessibility score and recommendations for a website",
  detailedAuditSchema,
  async ({ url, device, includeDetails }) => ({
    content: [
      {
        type: "text",
        text: `Accessibility score for ${url} on ${device}${includeDetails ? " with detailed recommendations" : ""}`,
      },
    ],
  }),
);

server.tool(
  "get_seo_analysis",
  "Get SEO analysis and recommendations for a website",
  detailedAuditSchema,
  async ({ url, device, includeDetails }) => ({
    content: [
      {
        type: "text",
        text: `SEO analysis for ${url} on ${device}${includeDetails ? " with detailed recommendations" : ""}`,
      },
    ],
  }),
);

server.tool(
  "check_pwa_readiness",
  "Check Progressive Web App readiness and requirements",
  detailedAuditSchema,
  async ({ url, device, includeDetails }) => ({
    content: [
      {
        type: "text",
        text: `PWA readiness check for ${url} on ${device}${includeDetails ? " with detailed requirements" : ""}`,
      },
    ],
  }),
);

server.tool(
  "compare_mobile_desktop",
  "Compare website performance between mobile and desktop devices",
  compareDevicesSchema,
  async ({ url, categories, throttling, includeDetails }) => ({
    content: [
      {
        type: "text",
        text: `Mobile vs Desktop comparison for ${url} with categories ${categories?.join(", ") || "all"}${includeDetails ? " (detailed)" : ""}`,
      },
    ],
  }),
);

server.tool(
  "check_performance_budget",
  "Check if website performance meets specified budget thresholds",
  performanceBudgetSchema,
  async ({ url, device, budget }) => ({
    content: [
      {
        type: "text",
        text: `Performance budget check for ${url} on ${device} with thresholds: ${JSON.stringify(budget)}`,
      },
    ],
  }),
);

server.tool(
  "get_security_audit",
  "Perform security audit checking HTTPS, CSP, and other security measures",
  securityAuditSchema,
  async ({ url, device, checks }) => ({
    content: [
      {
        type: "text",
        text: `Security audit for ${url} on ${device}${checks ? ` focusing on: ${checks.join(", ")}` : ""}`,
      },
    ],
  }),
);

server.tool(
  "get_lcp_opportunities",
  "Get optimization opportunities to improve Largest Contentful Paint",
  lcpOpportunitiesSchema,
  async ({ url, device, includeDetails, threshold }) => ({
    content: [
      {
        type: "text",
        text: `LCP optimization opportunities for ${url} on ${device}${threshold ? ` (threshold: ${threshold}s)` : ""}`,
      },
    ],
  }),
);

server.tool(
  "find_unused_javascript",
  "Find unused JavaScript code to reduce bundle size",
  unusedJavaScriptSchema,
  async ({ url, device, minBytes, includeSourceMaps }) => ({
    content: [
      {
        type: "text",
        text: `Unused JavaScript analysis for ${url} on ${device} (min: ${minBytes} bytes)${includeSourceMaps ? " with source maps" : ""}`,
      },
    ],
  }),
);

server.tool(
  "analyze_resources",
  "Analyze website resources (images, JS, CSS, fonts) for optimization opportunities",
  resourceAnalysisSchema,
  async ({ url, device, resourceTypes, minSize }) => ({
    content: [
      {
        type: "text",
        text: `Resource analysis for ${url} on ${device}${resourceTypes ? ` (types: ${resourceTypes.join(", ")})` : ""}${minSize ? ` (min size: ${minSize}KB)` : ""}`,
      },
    ],
  }),
);

// Start receiving messages on stdin and sending messages on stdout
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// eslint-disable-next-line no-console
main().catch(console.error);
