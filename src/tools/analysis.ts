import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resourceAnalysisSchema, unusedJavaScriptSchema } from "../schemas";
import { findUnusedJavaScript, analyzeResources } from "../lighthouse-analysis";

// Helper function to create structured content that's both AI and human readable
function createStructuredAnalysis(title: string, data: Record<string, unknown>, summary?: string) {
  return [
    {
      type: "text" as const,
      text: summary || `${title} completed successfully`,
    },
    {
      type: "text" as const,
      text: JSON.stringify(data, null, 2),
    },
  ];
}

export function registerAnalysisTools(server: McpServer) {
  server.tool(
    "find_unused_javascript",
    "Find unused JavaScript code to reduce bundle size",
    unusedJavaScriptSchema,
    async ({ url, device, minBytes }) => {
      try {
        const result = await findUnusedJavaScript(url, device, minBytes);

        // Create structured, AI-friendly response
        const analysisData = {
          url: result.url,
          device: result.device,
          timestamp: result.fetchTime,
          thresholdBytes: minBytes,
          summary: {
            totalUnusedKB: Math.round((result.totalUnusedBytes / 1024) * 100) / 100,
            totalFilesAnalyzed: result.items.length,
            hasUnusedCode: result.items.length > 0,
          },
          unusedFiles: result.items.map((item) => ({
            filename: item.url.split("/").pop() || item.url,
            totalKB: Math.round((item.totalBytes / 1024) * 100) / 100,
            unusedKB: Math.round((item.wastedBytes / 1024) * 100) / 100,
            unusedPercent: item.wastedPercent,
            url: item.url,
          })),
          recommendations:
            result.items.length > 0
              ? [
                  "Remove unused JavaScript code",
                  "Implement code splitting",
                  "Use tree shaking",
                  "Add lazy loading for non-critical scripts",
                ]
              : ["No optimization needed - minimal unused code detected"],
        };

        const summary =
          result.items.length > 0
            ? `Found ${result.items.length} files with unused JavaScript (${analysisData.summary.totalUnusedKB}KB total)`
            : `No significant unused JavaScript found above ${minBytes} byte threshold`;

        return {
          content: createStructuredAnalysis("Unused JavaScript Analysis", analysisData, summary),
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Analysis failed: ${errorMessage}`,
            },
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error: true,
                  url,
                  device,
                  message: errorMessage,
                  timestamp: new Date().toISOString(),
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
    "analyze_resources",
    "Analyze website resources (images, JS, CSS, fonts) for optimization opportunities",
    resourceAnalysisSchema,
    async ({ url, device, resourceTypes, minSize }) => {
      try {
        const result = await analyzeResources(url, device, resourceTypes, minSize);

        // Create structured, AI-friendly response
        const analysisData = {
          url: result.url,
          device: result.device,
          timestamp: result.fetchTime,
          filters: {
            resourceTypes: resourceTypes || ["all"],
            minSizeKB: minSize || 0,
          },
          summary: {
            totalResources: result.resources.length,
            totalSizeKB:
              Math.round((Object.values(result.summary).reduce((sum, data) => sum + data.totalSize, 0) / 1024) * 100) /
              100,
            resourceCounts: Object.fromEntries(
              Object.entries(result.summary).map(([type, data]) => [
                type,
                {
                  count: data.count,
                  sizeKB: Math.round((data.totalSize / 1024) * 100) / 100,
                },
              ]),
            ),
          },
          resources: result.resources.slice(0, 50).map((resource) => ({
            filename: resource.url.split("/").pop() || resource.url,
            type: resource.resourceType,
            sizeKB: Math.round(resource.sizeKB * 100) / 100,
            mimeType: resource.mimeType || "unknown",
            url: resource.url,
          })),
          optimization: {
            recommendations: [] as string[],
            priorities: [] as string[],
          },
        };

        // Add type-specific recommendations
        if (result.summary.images) {
          analysisData.optimization.recommendations.push("Convert images to WebP/AVIF formats");
          analysisData.optimization.recommendations.push("Implement lazy loading for images");
          analysisData.optimization.priorities.push("images");
        }
        if (result.summary.javascript) {
          analysisData.optimization.recommendations.push("Minify and compress JavaScript files");
          analysisData.optimization.recommendations.push("Remove unused JavaScript code");
          analysisData.optimization.priorities.push("javascript");
        }
        if (result.summary.css) {
          analysisData.optimization.recommendations.push("Minify CSS and remove unused styles");
          analysisData.optimization.priorities.push("css");
        }
        if (result.summary.fonts) {
          analysisData.optimization.recommendations.push("Use font-display: swap for better loading");
          analysisData.optimization.priorities.push("fonts");
        }

        if (analysisData.optimization.recommendations.length === 0) {
          analysisData.optimization.recommendations.push("Resource usage appears optimized");
        }

        // Add truncation info if needed
        if (result.resources.length > 50) {
          analysisData.resources.push({
            filename: `... and ${result.resources.length - 50} more resources`,
            type: "truncated",
            sizeKB: 0,
            mimeType: "info",
            url: "",
          });
        }

        const summary = `Analyzed ${result.resources.length} resources (${analysisData.summary.totalSizeKB}KB total) - ${analysisData.optimization.recommendations.length} optimization opportunities found`;

        return {
          content: createStructuredAnalysis("Resource Analysis", analysisData, summary),
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Analysis failed: ${errorMessage}`,
            },
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  error: true,
                  url,
                  device,
                  resourceTypes,
                  minSize,
                  message: errorMessage,
                  timestamp: new Date().toISOString(),
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
