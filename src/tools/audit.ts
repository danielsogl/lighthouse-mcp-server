import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runLighthouseAudit } from "../lighthouse";
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
}
