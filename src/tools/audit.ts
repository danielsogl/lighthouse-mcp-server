import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runLighthouseAudit } from "../lighthouse-core";
import { getAccessibilityScore, getSeoAnalysis, checkPwaReadiness } from "../lighthouse-categories";
import { auditParamsSchema, detailedAuditSchema } from "../schemas";

export function registerAuditTools(server: McpServer) {
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
    "get_accessibility_score",
    "Get the accessibility score and recommendations for a website",
    detailedAuditSchema,
    async ({ url, device, includeDetails }) => {
      try {
        const result = await getAccessibilityScore(url, device, includeDetails);

        const content = [
          {
            type: "text" as const,
            text: `# Accessibility Score\n\n**URL:** ${result.url}\n**Device:** ${result.device}\n**Accessibility Score:** ${result.accessibilityScore}/100\n**Timestamp:** ${new Date(result.fetchTime).toLocaleString()}`,
          },
        ];

        if (includeDetails && "audits" in result) {
          content.push({
            type: "text" as const,
            text: `## Accessibility Audits\n\n${result.audits
              .map(
                (audit) =>
                  `### ${audit.title}\n- **Score:** ${audit.score !== null ? Math.round((audit.score || 0) * 100) : "N/A"}/100\n- **Description:** ${audit.description}\n- **Display Value:** ${audit.displayValue || "N/A"}`,
              )
              .join("\n\n")}`,
          });

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
              text: `# Accessibility Score Error\n\n**URL:** ${url}\n**Error:** ${errorMessage}`,
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

        const content = [
          {
            type: "text" as const,
            text: `# SEO Analysis\n\n**URL:** ${result.url}\n**Device:** ${result.device}\n**SEO Score:** ${result.seoScore}/100\n**Timestamp:** ${new Date(result.fetchTime).toLocaleString()}`,
          },
        ];

        if (includeDetails && "audits" in result) {
          content.push({
            type: "text" as const,
            text: `## SEO Audits\n\n${result.audits
              .map(
                (audit) =>
                  `### ${audit.title}\n- **Score:** ${audit.score !== null ? Math.round((audit.score || 0) * 100) : "N/A"}/100\n- **Description:** ${audit.description}\n- **Display Value:** ${audit.displayValue || "N/A"}`,
              )
              .join("\n\n")}`,
          });

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
              text: `# SEO Analysis Error\n\n**URL:** ${url}\n**Error:** ${errorMessage}`,
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

        const content = [
          {
            type: "text" as const,
            text: `# PWA Readiness Check\n\n**URL:** ${result.url}\n**Device:** ${result.device}\n**PWA Score:** ${result.pwaScore}/100\n**Timestamp:** ${new Date(result.fetchTime).toLocaleString()}`,
          },
        ];

        if (includeDetails && "audits" in result) {
          content.push({
            type: "text" as const,
            text: `## PWA Audits\n\n${result.audits
              .map(
                (audit) =>
                  `### ${audit.title}\n- **Score:** ${audit.score !== null ? Math.round((audit.score || 0) * 100) : "N/A"}/100\n- **Description:** ${audit.description}\n- **Display Value:** ${audit.displayValue || "N/A"}`,
              )
              .join("\n\n")}`,
          });

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
              text: `# PWA Readiness Check Error\n\n**URL:** ${url}\n**Error:** ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
