import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { securityAuditSchema } from "../schemas";

export function registerSecurityTools(server: McpServer) {
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
}
