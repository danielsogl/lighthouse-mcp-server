import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  basicAuditSchema,
  coreWebVitalsSchema,
  performanceBudgetSchema,
  compareDevicesSchema,
  lcpOpportunitiesSchema,
} from "../schemas";

export function registerPerformanceTools(server: McpServer) {
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
    "compare_mobile_desktop",
    "Compare website performance between mobile and desktop devices",
    compareDevicesSchema,
    async ({ url, categories, includeDetails }) => ({
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
    "get_lcp_opportunities",
    "Get optimization opportunities to improve Largest Contentful Paint",
    lcpOpportunitiesSchema,
    async ({ url, device, threshold }) => ({
      content: [
        {
          type: "text",
          text: `LCP optimization opportunities for ${url} on ${device}${threshold ? ` (threshold: ${threshold}s)` : ""}`,
        },
      ],
    }),
  );
}
