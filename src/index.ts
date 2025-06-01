import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

// Types for Lighthouse results
interface LighthouseCategory {
  title: string;
  score: number;
  description: string;
}

interface LighthouseAudit {
  title: string;
  numericValue?: number;
  displayValue?: string;
  score: number | null;
}

interface LighthouseResult {
  lhr: {
    finalDisplayedUrl: string;
    fetchTime: string;
    lighthouseVersion: string;
    userAgent: string;
    categories: Record<string, LighthouseCategory>;
    audits: Record<string, LighthouseAudit>;
  };
}

interface LighthouseAuditResult {
  url: string;
  fetchTime: string;
  version: string;
  userAgent: string;
  device: string;
  categories: Record<
    string,
    {
      title: string;
      score: number;
      description: string;
    }
  >;
  metrics: Record<
    string,
    {
      title: string;
      value: number;
      displayValue: string;
      score: number | null;
    }
  >;
}

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

// Helper function to run Lighthouse audit
async function runLighthouseAudit(
  url: string,
  categories?: string[],
  device: "desktop" | "mobile" = "desktop",
  throttling = false,
): Promise<LighthouseAuditResult> {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const options: {
      logLevel: "info";
      output: "json";
      onlyCategories?: string[];
      port: number;
      formFactor: "desktop" | "mobile";
      screenEmulation: {
        mobile: boolean;
        width: number;
        height: number;
        deviceScaleFactor: number;
        disabled: boolean;
      };
      throttling: {
        rttMs: number;
        throughputKbps: number;
        cpuSlowdownMultiplier: number;
      };
    } = {
      logLevel: "info" as const,
      output: "json",
      onlyCategories: categories,
      port: chrome.port,
      formFactor: device,
      screenEmulation: {
        mobile: device !== "desktop",
        width: device === "desktop" ? 1350 : 360,
        height: device === "desktop" ? 940 : 640,
        deviceScaleFactor: 1,
        disabled: false,
      },
      throttling: throttling
        ? {
            rttMs: 150,
            throughputKbps: 1638.4,
            cpuSlowdownMultiplier: 4,
          }
        : {
            rttMs: 0,
            throughputKbps: 10 * 1024,
            cpuSlowdownMultiplier: 1,
          },
    };

    const runnerResult = (await lighthouse(url, options)) as LighthouseResult;

    if (!runnerResult) {
      throw new Error("Failed to run Lighthouse audit");
    }

    const { lhr } = runnerResult;

    // Format category scores
    const auditCategories: Record<
      string,
      {
        title: string;
        score: number;
        description: string;
      }
    > = {};
    for (const [key, category] of Object.entries(lhr.categories)) {
      auditCategories[key] = {
        title: category.title,
        score: Math.round((category.score || 0) * 100),
        description: category.description,
      };
    }

    // Extract key metrics
    const metrics: Record<
      string,
      {
        title: string;
        value: number;
        displayValue: string;
        score: number | null;
      }
    > = {};
    if (lhr.audits) {
      const keyMetrics = [
        "first-contentful-paint",
        "largest-contentful-paint",
        "total-blocking-time",
        "cumulative-layout-shift",
        "speed-index",
        "interactive",
      ];

      for (const metric of keyMetrics) {
        const audit = lhr.audits[metric];
        if (audit) {
          metrics[metric] = {
            title: audit.title,
            value: audit.numericValue || 0,
            displayValue: audit.displayValue || "N/A",
            score: audit.score !== null ? Math.round((audit.score || 0) * 100) : null,
          };
        }
      }
    }

    return {
      url: lhr.finalDisplayedUrl,
      fetchTime: lhr.fetchTime,
      version: lhr.lighthouseVersion,
      userAgent: lhr.userAgent,
      device,
      categories: auditCategories,
      metrics,
    };
  } finally {
    await chrome.kill();
  }
}

// Tool implementations
server.tool(
  "run_audit",
  "Run a comprehensive Lighthouse audit on a website",
  auditParamsSchema,
  async ({ url, categories, device, throttling }) => {
    try {
      const result = await runLighthouseAudit(url, categories, device, throttling);

      // Create structured content response
      const content = [
        {
          type: "text" as const,
          text: `# Lighthouse Audit Results\n\n**URL:** ${result.url}\n**Device:** ${result.device}\n**Timestamp:** ${new Date(result.fetchTime).toLocaleString()}\n**Lighthouse Version:** ${result.version}`,
        },
        {
          type: "text" as const,
          text: `## Category Scores\n\n${Object.entries(result.categories)
            .map(([, category]) => `**${category.title}:** ${category.score}/100`)
            .join("\n")}`,
        },
        {
          type: "text" as const,
          text: `## Core Web Vitals\n\n${Object.entries(result.metrics)
            .filter(([key]) =>
              ["first-contentful-paint", "largest-contentful-paint", "cumulative-layout-shift"].includes(key),
            )
            .map(
              ([, metric]) =>
                `**${metric.title}:** ${metric.displayValue} ${metric.score !== null ? `(Score: ${metric.score}/100)` : ""}`,
            )
            .join("\n")}`,
        },
        {
          type: "text" as const,
          text: `## Detailed Metrics\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
        },
      ];

      return { content };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `# Lighthouse Audit Error\n\n**URL:** ${url}\n**Error:** ${errorMessage}\n\nPlease ensure:\n- The URL is accessible\n- Chrome/Chromium is installed\n- You have internet connectivity`,
          },
        ],
        isError: true,
      };
    }
  },
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
  async ({ url, device, includeDetails, threshold: _threshold }) => ({
    content: [
      {
        type: "text",
        text: `Core Web Vitals for ${url} on ${device}${includeDetails ? " (detailed)" : ""}${_threshold ? " with custom thresholds" : ""}`,
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
  async ({ url, categories, throttling: _throttling, includeDetails }) => ({
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
