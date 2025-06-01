import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { securityAuditSchema } from "../schemas";
import { getSecurityAudit } from "../lighthouse";

export function registerSecurityTools(server: McpServer) {
  server.tool(
    "get_security_audit",
    "Perform security audit checking HTTPS, CSP, and other security measures",
    securityAuditSchema,
    async ({ url, device, checks }) => {
      try {
        const result = await getSecurityAudit(url, device, checks);

        const content = [
          {
            type: "text" as const,
            text: `# Security Audit\n\n**URL:** ${result.url}\n**Device:** ${result.device}\n**Overall Security Score:** ${result.overallScore}/100\n**Timestamp:** ${new Date(result.fetchTime).toLocaleString()}`,
          },
        ];

        if (result.audits.length > 0) {
          content.push({
            type: "text" as const,
            text: `## Security Audits\n\n${result.audits
              .map((audit) => {
                const auditItem = audit as {
                  id: string;
                  title: string;
                  description?: string;
                  score: number | null;
                  scoreDisplayMode?: string;
                  displayValue?: string;
                };
                const scoreText = auditItem.score !== null ? Math.round((auditItem.score || 0) * 100) : "N/A";
                const status = auditItem.score === 1 ? "✅" : auditItem.score === 0 ? "❌" : "⚠️";

                return `### ${status} ${auditItem.title}\n- **Score:** ${scoreText}/100\n- **Description:** ${auditItem.description || "N/A"}\n- **Display Value:** ${auditItem.displayValue || "N/A"}`;
              })
              .join("\n\n")}`,
          });

          // Add security recommendations
          const recommendations = [
            "- **HTTPS**: Ensure all resources are served over HTTPS",
            "- **HTTP/2**: Use HTTP/2 for better performance and security",
            "- **Content Security Policy**: Implement CSP headers to prevent XSS attacks",
            "- **Vulnerable Libraries**: Keep all dependencies up to date",
            "- **External Links**: Use rel=noopener for external links to prevent window.opener attacks",
          ];

          content.push({
            type: "text" as const,
            text: `## Security Recommendations\n\n${recommendations.join("\n")}`,
          });
        } else {
          content.push({
            type: "text" as const,
            text: "## No security audits found\n\nNo security-related audits were performed or found issues.",
          });
        }

        content.push({
          type: "text" as const,
          text: `## Detailed Results\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
        });

        return { content };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `# Security Audit Error\n\n**URL:** ${url}\n**Error:** ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
