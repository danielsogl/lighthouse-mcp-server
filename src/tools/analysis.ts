import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resourceAnalysisSchema, unusedJavaScriptSchema } from "@/schemas";

export function registerAnalysisTools(server: McpServer) {
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
}
