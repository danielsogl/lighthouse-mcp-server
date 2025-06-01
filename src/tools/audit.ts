import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runLighthouseAudit } from "../lighthouse-core";
import { getAccessibilityScore, getSeoAnalysis, checkPwaReadiness } from "../lighthouse-categories";
import { auditParamsSchema, detailedAuditSchema } from "../schemas";

interface StructuredResponse {
  summary: string;
  data: Record<string, unknown>;
  recommendations?: string[];
}

function createStructuredAudit(
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

export function registerAuditTools(server: McpServer) {
  server.tool(
    "run_audit",
    "Run a comprehensive Lighthouse audit on a website",
    auditParamsSchema,
    async ({ url, categories, device, throttling }) => {
      try {
        const result = await runLighthouseAudit(url, categories, device, throttling);

        const structuredResult = createStructuredAudit(
          "Lighthouse Audit",
          result.url,
          result.device,
          {
            categories: Object.fromEntries(
              Object.entries(result.categories).map(([key, category]) => [
                key,
                {
                  title: category.title,
                  score: category.score,
                },
              ]),
            ),
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
            version: result.version,
            fetchTime: result.fetchTime,
          },
          [
            "Focus on Core Web Vitals for performance improvements",
            "Ensure accessibility standards compliance (WCAG 2.1)",
            "Implement SEO best practices for better search visibility",
            "Consider Progressive Web App features for enhanced user experience",
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
                  error: "Lighthouse audit failed",
                  url,
                  device: device || "desktop",
                  message: errorMessage,
                  troubleshooting: [
                    "Ensure the URL is accessible",
                    "Verify Chrome/Chromium is installed",
                    "Check internet connectivity",
                  ],
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
    "get_accessibility_score",
    "Get the accessibility score and recommendations for a website",
    detailedAuditSchema,
    async ({ url, device, includeDetails }) => {
      try {
        const result = await getAccessibilityScore(url, device, includeDetails);

        const data: Record<string, unknown> = {
          accessibilityScore: result.accessibilityScore,
          fetchTime: result.fetchTime,
          includeDetails,
        };

        if (includeDetails && "audits" in result) {
          data.audits = result.audits.map((audit) => ({
            title: audit.title,
            score: audit.score !== null ? Math.round((audit.score || 0) * 100) : null,
            description: audit.description,
            displayValue: audit.displayValue || "N/A",
          }));
        }

        const structuredResult = createStructuredAudit("Accessibility Score", result.url, result.device, data, [
          "Ensure proper semantic HTML structure",
          "Provide alt text for all images",
          "Maintain sufficient color contrast ratios",
          "Implement keyboard navigation support",
          "Use ARIA labels and roles appropriately",
        ]);

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
                  error: "Accessibility analysis failed",
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
    "get_seo_analysis",
    "Get SEO analysis and recommendations for a website",
    detailedAuditSchema,
    async ({ url, device, includeDetails }) => {
      try {
        const result = await getSeoAnalysis(url, device, includeDetails);

        const data: Record<string, unknown> = {
          seoScore: result.seoScore,
          fetchTime: result.fetchTime,
          includeDetails,
        };

        if (includeDetails && "audits" in result) {
          data.audits = result.audits.map((audit) => ({
            title: audit.title,
            score: audit.score !== null ? Math.round((audit.score || 0) * 100) : null,
            description: audit.description,
            displayValue: audit.displayValue || "N/A",
          }));
        }

        const structuredResult = createStructuredAudit("SEO Analysis", result.url, result.device, data, [
          "Optimize meta titles and descriptions",
          "Implement structured data markup",
          "Ensure mobile-friendly responsive design",
          "Improve page loading speed",
          "Create XML sitemap and robots.txt",
        ]);

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
                  error: "SEO analysis failed",
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
    "check_pwa_readiness",
    "Check Progressive Web App readiness and requirements",
    detailedAuditSchema,
    async ({ url, device, includeDetails }) => {
      try {
        const result = await checkPwaReadiness(url, device, includeDetails);

        const data: Record<string, unknown> = {
          pwaScore: result.pwaScore,
          fetchTime: result.fetchTime,
          includeDetails,
        };

        if (includeDetails && "audits" in result) {
          data.audits = result.audits.map((audit) => ({
            title: audit.title,
            score: audit.score !== null ? Math.round((audit.score || 0) * 100) : null,
            description: audit.description,
            displayValue: audit.displayValue || "N/A",
          }));
        }

        const structuredResult = createStructuredAudit("PWA Readiness Check", result.url, result.device, data, [
          "Create a web app manifest file",
          "Implement service worker for offline functionality",
          "Ensure HTTPS deployment",
          "Add app icons for different platforms",
          "Configure viewport meta tag for mobile",
        ]);

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
                  error: "PWA readiness check failed",
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
