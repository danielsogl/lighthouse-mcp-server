import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resourceAnalysisSchema, unusedJavaScriptSchema } from "../schemas";
import { findUnusedJavaScript, analyzeResources } from "../lighthouse";

export function registerAnalysisTools(server: McpServer) {
  server.tool(
    "find_unused_javascript",
    "Find unused JavaScript code to reduce bundle size",
    unusedJavaScriptSchema,
    async ({ url, device, minBytes }) => {
      try {
        const result = await findUnusedJavaScript(url, device, minBytes);

        const content = [
          {
            type: "text" as const,
            text: `# Unused JavaScript Analysis\n\n**URL:** ${result.url}\n**Device:** ${result.device}\n**Total Unused Bytes:** ${(result.totalUnusedBytes / 1024).toFixed(2)} KB\n**Minimum Threshold:** ${minBytes} bytes\n**Timestamp:** ${new Date(result.fetchTime).toLocaleString()}`,
          },
        ];

        if (result.items.length > 0) {
          content.push({
            type: "text" as const,
            text: `## Unused JavaScript Files\n\n| File | Total Size | Unused Bytes | Unused % |\n|------|------------|--------------|----------|\n${result.items
              .map(
                (item) =>
                  `| ${item.url.split("/").pop() || item.url} | ${(item.totalBytes / 1024).toFixed(2)} KB | ${(item.wastedBytes / 1024).toFixed(2)} KB | ${item.wastedPercent}% |`,
              )
              .join("\n")}`,
          });

          content.push({
            type: "text" as const,
            text: "## Recommendations\n\n- Remove unused JavaScript code to reduce bundle size\n- Consider code splitting to load only necessary code\n- Use tree shaking to eliminate dead code\n- Implement lazy loading for non-critical JavaScript",
          });
        } else {
          content.push({
            type: "text" as const,
            text: `## No unused JavaScript found\n\nGreat! No significant unused JavaScript was detected above the ${minBytes} byte threshold.`,
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
              text: `# Unused JavaScript Analysis Error\n\n**URL:** ${url}\n**Error:** ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.tool(
    "analyze_resources",
    "Analyze website resources (images, JS, CSS, fonts) for optimization opportunities",
    resourceAnalysisSchema,
    async ({ url, device, resourceTypes, minSize }) => {
      try {
        const result = await analyzeResources(url, device, resourceTypes, minSize);

        const content = [
          {
            type: "text" as const,
            text: `# Resource Analysis\n\n**URL:** ${result.url}\n**Device:** ${result.device}\n**Total Resources:** ${result.resources.length}\n**Filters:** ${resourceTypes ? `Types: ${resourceTypes.join(", ")}` : "All types"}${minSize ? `, Min size: ${minSize}KB` : ""}\n**Timestamp:** ${new Date(result.fetchTime).toLocaleString()}`,
          },
        ];

        if (Object.keys(result.summary).length > 0) {
          content.push({
            type: "text" as const,
            text: `## Resource Summary\n\n| Type | Count | Total Size |\n|------|-------|------------|\n${Object.entries(
              result.summary,
            )
              .map(([type, data]) => `| ${type} | ${data.count} | ${(data.totalSize / 1024).toFixed(2)} KB |`)
              .join("\n")}`,
          });
        }

        if (result.resources.length > 0) {
          content.push({
            type: "text" as const,
            text: `## Resource Details\n\n| File | Type | Size | MIME Type |\n|------|------|------|----------|\n${result.resources
              .slice(0, 20) // Limit to first 20 resources to avoid overwhelming output
              .map(
                (resource) =>
                  `| ${resource.url.split("/").pop() || resource.url} | ${resource.resourceType} | ${resource.sizeKB.toFixed(2)} KB | ${resource.mimeType || "N/A"} |`,
              )
              .join(
                "\n",
              )}${result.resources.length > 20 ? `\n\n*Showing first 20 of ${result.resources.length} resources*` : ""}`,
          });

          // Add optimization recommendations based on resource types
          const recommendations = [];
          if (result.summary.images) {
            recommendations.push(
              "- **Images**: Consider using modern formats (WebP, AVIF), optimize image sizes, and implement lazy loading",
            );
          }
          if (result.summary.javascript) {
            recommendations.push(
              "- **JavaScript**: Minify and compress JS files, remove unused code, implement code splitting",
            );
          }
          if (result.summary.css) {
            recommendations.push("- **CSS**: Minify CSS, remove unused styles, consider critical CSS inlining");
          }
          if (result.summary.fonts) {
            recommendations.push(
              "- **Fonts**: Use font-display: swap, preload critical fonts, consider variable fonts",
            );
          }

          if (recommendations.length > 0) {
            content.push({
              type: "text" as const,
              text: `## Optimization Recommendations\n\n${recommendations.join("\n")}`,
            });
          }
        } else {
          content.push({
            type: "text" as const,
            text: "## No resources found\n\nNo resources matched the specified criteria.",
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
              text: `# Resource Analysis Error\n\n**URL:** ${url}\n**Error:** ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}
