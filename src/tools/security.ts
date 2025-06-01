import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { securityAuditSchema } from "../schemas";
import { getSecurityAudit } from "../lighthouse-analysis";

interface StructuredResponse {
  summary: string;
  data: Record<string, unknown>;
  recommendations?: string[];
}

function createStructuredSecurity(
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

export function registerSecurityTools(server: McpServer) {
  server.tool(
    "get_security_audit",
    "Perform security audit checking HTTPS, CSP, and other security measures",
    securityAuditSchema,
    async ({ url, device, checks }) => {
      try {
        const result = await getSecurityAudit(url, device, checks);

        const audits = result.audits.map((audit) => {
          const auditItem = audit as {
            id: string;
            title: string;
            description?: string;
            score: number | null;
            scoreDisplayMode?: string;
            displayValue?: string;
          };

          return {
            id: auditItem.id,
            title: auditItem.title,
            description: auditItem.description || "N/A",
            score: auditItem.score !== null ? Math.round((auditItem.score || 0) * 100) : null,
            displayValue: auditItem.displayValue || "N/A",
            status: auditItem.score === 1 ? "pass" : auditItem.score === 0 ? "fail" : "warning",
          };
        });

        const structuredResult = createStructuredSecurity(
          "Security Audit",
          result.url,
          result.device,
          {
            overallScore: result.overallScore,
            audits,
            auditCount: audits.length,
            passedAudits: audits.filter((a) => a.status === "pass").length,
            failedAudits: audits.filter((a) => a.status === "fail").length,
            fetchTime: result.fetchTime,
          },
          [
            "Ensure all resources are served over HTTPS",
            "Implement Content Security Policy (CSP) headers to prevent XSS attacks",
            "Keep all dependencies and libraries up to date",
            "Use rel=noopener for external links to prevent window.opener attacks",
            "Enable HTTP Strict Transport Security (HSTS) headers",
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
                  error: "Security audit failed",
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
