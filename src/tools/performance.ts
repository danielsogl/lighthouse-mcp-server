import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  basicAuditSchema,
  coreWebVitalsSchema,
  performanceBudgetSchema,
  compareDevicesSchema,
  lcpOpportunitiesSchema,
} from "../schemas";
import {
  getPerformanceScore,
  getCoreWebVitals,
  checkPerformanceBudget,
  compareMobileDesktop,
  getLcpOpportunities,
} from "../lighthouse";

export function registerPerformanceTools(server: McpServer) {
  server.tool(
    "get_performance_score",
    "Get the performance score for a website",
    basicAuditSchema,
    async ({ url, device }) => {
      try {
        const result = await getPerformanceScore(url, device);

        const content = [
          {
            type: "text" as const,
            text: `# Performance Score\n\n**URL:** ${result.url}\n**Device:** ${result.device}\n**Performance Score:** ${result.performanceScore}/100\n**Timestamp:** ${new Date(result.fetchTime).toLocaleString()}`,
          },
          {
            type: "text" as const,
            text: `## Core Metrics\n\n${Object.entries(result.metrics)
              .map(
                ([, metric]) =>
                  `**${metric.title}:** ${metric.displayValue} ${metric.score !== null ? `(Score: ${metric.score}/100)` : ""}`,
              )
              .join("\n")}`,
          },
          {
            type: "text" as const,
            text: `## Detailed Results\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
          },
        ];

        return { content };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `# Performance Score Error\n\n**URL:** ${url}\n**Error:** ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "get_core_web_vitals",
    "Get Core Web Vitals metrics for a website",
    coreWebVitalsSchema,
    async ({ url, device, includeDetails, threshold }) => {
      try {
        const result = await getCoreWebVitals(url, device, threshold);

        const content = [
          {
            type: "text" as const,
            text: `# Core Web Vitals\n\n**URL:** ${result.url}\n**Device:** ${result.device}\n**Timestamp:** ${new Date(result.fetchTime).toLocaleString()}`,
          },
          {
            type: "text" as const,
            text: `## Core Web Vitals Metrics\n\n${Object.entries(result.coreWebVitals)
              .map(
                ([key, metric]) =>
                  `**${metric?.title || key.toUpperCase()}:** ${metric?.displayValue || "N/A"} ${metric?.score !== null ? `(Score: ${metric.score}/100)` : ""}`,
              )
              .join("\n")}`,
          },
        ];

        if (result.thresholdResults) {
          content.push({
            type: "text" as const,
            text: `## Threshold Results\n\n${Object.entries(result.thresholdResults)
              .filter(([, passed]) => passed !== null)
              .map(([key, passed]) => `**${key.toUpperCase()}:** ${passed ? "✅ PASS" : "❌ FAIL"}`)
              .join("\n")}`,
          });
        }

        if (includeDetails) {
          content.push({
            type: "text" as const,
            text: `## Detailed Results\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
          });
        }

        return { content };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `# Core Web Vitals Error\n\n**URL:** ${url}\n**Error:** ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "compare_mobile_desktop",
    "Compare website performance between mobile and desktop devices",
    compareDevicesSchema,
    async ({ url, categories, throttling, includeDetails }) => {
      try {
        const result = await compareMobileDesktop(url, categories, throttling);

        const content = [
          {
            type: "text" as const,
            text: `# Mobile vs Desktop Comparison\n\n**URL:** ${result.url}`,
          },
          {
            type: "text" as const,
            text: `## Category Scores\n\n| Category | Mobile | Desktop | Difference |\n|----------|--------|---------|------------|\n${Object.entries(
              result.differences,
            )
              .map(
                ([category, diff]) =>
                  `| ${category} | ${diff.mobile}/100 | ${diff.desktop}/100 | ${diff.difference > 0 ? "+" : ""}${diff.difference} |`,
              )
              .join("\n")}`,
          },
        ];

        if (includeDetails) {
          content.push({
            type: "text" as const,
            text: `## Detailed Results\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
          });
        }

        return { content };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `# Mobile vs Desktop Comparison Error\n\n**URL:** ${url}\n**Error:** ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "check_performance_budget",
    "Check if website performance meets specified budget thresholds",
    performanceBudgetSchema,
    async ({ url, device, budget }) => {
      try {
        const result = await checkPerformanceBudget(url, device, budget);

        const content = [
          {
            type: "text" as const,
            text: `# Performance Budget Check\n\n**URL:** ${result.url}\n**Device:** ${result.device}\n**Overall Result:** ${result.overallPassed ? "✅ PASSED" : "❌ FAILED"}\n**Timestamp:** ${new Date(result.fetchTime).toLocaleString()}`,
          },
          {
            type: "text" as const,
            text: `## Budget Results\n\n| Metric | Actual | Budget | Status |\n|--------|--------|--------|--------|\n${Object.entries(
              result.results,
            )
              .map(
                ([metric, data]) =>
                  `| ${metric} | ${data.actual}${data.unit === "score" ? "/100" : data.unit} | ${data.budget}${data.unit === "score" ? "/100" : data.unit} | ${data.passed ? "✅ PASS" : "❌ FAIL"} |`,
              )
              .join("\n")}`,
          },
          {
            type: "text" as const,
            text: `## Detailed Results\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
          },
        ];

        return { content };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `# Performance Budget Check Error\n\n**URL:** ${url}\n**Error:** ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "get_lcp_opportunities",
    "Get optimization opportunities to improve Largest Contentful Paint",
    lcpOpportunitiesSchema,
    async ({ url, device, threshold, includeDetails }) => {
      try {
        const result = await getLcpOpportunities(url, device, threshold);

        const content = [
          {
            type: "text" as const,
            text: `# LCP Optimization Opportunities\n\n**URL:** ${result.url}\n**Device:** ${result.device}\n**Current LCP:** ${result.lcpValue.toFixed(2)}s\n**Threshold:** ${result.threshold}s\n**Needs Improvement:** ${result.needsImprovement ? "❌ YES" : "✅ NO"}\n**Timestamp:** ${new Date(result.fetchTime).toLocaleString()}`,
          },
        ];

        if (result.opportunities.length > 0) {
          content.push({
            type: "text" as const,
            text: `## Optimization Opportunities\n\n${result.opportunities
              .map(
                (opp) =>
                  `### ${opp?.title}\n- **Score:** ${opp?.score ? Math.round(opp.score * 100) : 0}/100\n- **Description:** ${opp?.description}\n- **Potential Savings:** ${opp?.displayValue || "N/A"}`,
              )
              .join("\n\n")}`,
          });
        } else {
          content.push({
            type: "text" as const,
            text: "## No optimization opportunities found\n\nYour LCP is already well optimized!",
          });
        }

        if (includeDetails) {
          content.push({
            type: "text" as const,
            text: `## Detailed Results\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
          });
        }

        return { content };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `# LCP Opportunities Error\n\n**URL:** ${url}\n**Error:** ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
