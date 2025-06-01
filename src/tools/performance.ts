import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  basicAuditSchema,
  coreWebVitalsSchema,
  compareDevicesSchema,
  performanceBudgetSchema,
  lcpOpportunitiesSchema,
} from "../schemas";
import {
  getPerformanceScore,
  getCoreWebVitals,
  compareMobileDesktop,
  checkPerformanceBudget,
  getLcpOpportunities,
} from "../lighthouse-performance";

interface StructuredResponse {
  summary: string;
  data: Record<string, unknown>;
  recommendations?: string[];
}

function createStructuredPerformance(
  type: string,
  url: string,
  device: string,
  data: Record<string, unknown>,
  recommendations?: string[],
): StructuredResponse {
  return {
    summary: `${type} analysis for ${url} on ${device}`,
    data,
    ...(recommendations && { recommendations }),
  };
}

export function registerPerformanceTools(server: McpServer) {
  server.tool(
    "get_performance_score",
    "Get the performance score for a website",
    basicAuditSchema,
    async ({ url, device }) => {
      try {
        const result = await getPerformanceScore(url, device);

        const structuredResult = createStructuredPerformance(
          "Performance Score",
          result.url,
          result.device,
          {
            performanceScore: result.performanceScore,
            metrics: Object.fromEntries(
              Object.entries(result.metrics).map(([key, metric]) => [
                key,
                {
                  title: metric.title,
                  value: metric.displayValue,
                  score: metric.score,
                },
              ]),
            ),
            fetchTime: result.fetchTime,
          },
          [
            "Focus on Core Web Vitals improvements",
            "Optimize largest contentful paint for better user experience",
            "Reduce total blocking time to improve interactivity",
          ],
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(structuredResult, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error: "Performance analysis failed",
                  url,
                  device: device || "desktop",
                  message: errorMessage,
                },
                null,
                2,
              ),
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

        const structuredResult = createStructuredPerformance(
          "Core Web Vitals",
          result.url,
          result.device,
          {
            coreWebVitals: Object.fromEntries(
              Object.entries(result.coreWebVitals).map(([key, metric]) => [
                key,
                {
                  title: metric?.title || key.toUpperCase(),
                  value: metric?.displayValue || "N/A",
                  score: metric?.score,
                },
              ]),
            ),
            thresholdResults: result.thresholdResults || {},
            fetchTime: result.fetchTime,
            includeDetails,
          },
          [
            "Optimize Largest Contentful Paint (LCP) < 2.5s",
            "Minimize First Input Delay (FID) < 100ms",
            "Reduce Cumulative Layout Shift (CLS) < 0.1",
          ],
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(structuredResult, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error: "Core Web Vitals analysis failed",
                  url,
                  device: device || "desktop",
                  message: errorMessage,
                },
                null,
                2,
              ),
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

        const structuredResult = createStructuredPerformance(
          "Mobile vs Desktop Comparison",
          result.url,
          "mobile + desktop",
          {
            differences: Object.fromEntries(
              Object.entries(result.differences).map(([category, diff]) => [
                category,
                {
                  mobile: diff.mobile,
                  desktop: diff.desktop,
                  difference: diff.difference,
                  better: diff.difference > 0 ? "desktop" : "mobile",
                },
              ]),
            ),
            includeDetails,
          },
          [
            "Mobile performance typically requires more optimization",
            "Focus on image optimization for mobile devices",
            "Consider implementing responsive design best practices",
          ],
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(structuredResult, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error: "Mobile vs Desktop comparison failed",
                  url,
                  message: errorMessage,
                },
                null,
                2,
              ),
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

        const structuredResult = createStructuredPerformance(
          "Performance Budget Check",
          result.url,
          result.device,
          {
            overallPassed: result.overallPassed,
            results: Object.fromEntries(
              Object.entries(result.results).map(([metric, data]) => [
                metric,
                {
                  actual: data.actual,
                  budget: data.budget,
                  unit: data.unit,
                  passed: data.passed,
                  difference:
                    typeof data.actual === "number" && typeof data.budget === "number"
                      ? data.actual - data.budget
                      : null,
                },
              ]),
            ),
            fetchTime: result.fetchTime,
          },
          result.overallPassed
            ? ["Performance budget requirements met"]
            : [
                "Review failing metrics and optimize accordingly",
                "Consider adjusting budget thresholds if realistic",
                "Focus on the metrics with largest budget overruns",
              ],
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(structuredResult, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error: "Performance budget check failed",
                  url,
                  device: device || "desktop",
                  message: errorMessage,
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "get_lcp_opportunities",
    "Get LCP optimization opportunities for a website",
    lcpOpportunitiesSchema,
    async ({ url, device, threshold, includeDetails }) => {
      try {
        const result = await getLcpOpportunities(url, device, threshold);

        const structuredResult = createStructuredPerformance(
          "LCP Optimization Opportunities",
          result.url,
          result.device,
          {
            lcpValue: result.lcpValue,
            threshold: result.threshold,
            needsImprovement: result.needsImprovement,
            opportunities: result.opportunities || [],
            fetchTime: result.fetchTime,
            includeDetails,
          },
          !result.needsImprovement
            ? ["LCP performance is within acceptable range"]
            : [
                "Optimize image loading and compression",
                "Implement resource hints (preload, prefetch)",
                "Reduce server response times",
                "Minimize render-blocking resources",
              ],
        );

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(structuredResult, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error: "LCP opportunities analysis failed",
                  url,
                  device: device || "desktop",
                  message: errorMessage,
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }
    },
  );
}
