import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerAnalysisTools } from "./analysis.js";
import { collectTools, callTool } from "./harness.js";
import * as analysis from "../lighthouse-analysis.js";

vi.mock("../lighthouse-analysis.js", () => ({
  findUnusedJavaScript: vi.fn(),
  analyzeResources: vi.fn(),
}));

const tools = collectTools(registerAnalysisTools);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("tools/analysis registration", () => {
  it("registers both analysis tools with titles and read-only annotations", () => {
    expect([...tools.keys()]).toEqual(["find_unused_javascript", "analyze_resources"]);

    for (const tool of tools.values()) {
      expect(tool.config.title).toBeTruthy();
      expect(tool.config.annotations).toEqual({ readOnlyHint: true, openWorldHint: true });
    }
  });
});

describe("find_unused_javascript", () => {
  it("summarises unused files and converts byte counts to KB", async () => {
    vi.mocked(analysis.findUnusedJavaScript).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      fetchTime: "2026-01-01T00:00:00.000Z",
      totalUnusedBytes: 10240,
      items: [{ url: "https://example.com/app.js", totalBytes: 20480, wastedBytes: 10240, wastedPercent: 50 }],
    });

    const { isError, payload, content } = await callTool(tools, "find_unused_javascript", {
      url: "https://example.com/",
      device: "desktop",
      minBytes: 2048,
    });

    expect(isError).toBe(false);
    expect(payload.summary).toEqual({ totalUnusedKB: 10, totalFilesAnalyzed: 1, hasUnusedCode: true });
    expect(payload.unusedFiles[0]).toMatchObject({ filename: "app.js", totalKB: 20, unusedKB: 10, unusedPercent: 50 });
    expect(payload.recommendations).toContain("Remove unused JavaScript code");
    expect(content[0].text).toContain("Found 1 files with unused JavaScript");
  });

  it("reports the no-op case when nothing exceeds the threshold", async () => {
    vi.mocked(analysis.findUnusedJavaScript).mockResolvedValue({
      url: "https://example.com/",
      device: "mobile",
      fetchTime: "2026-01-01T00:00:00.000Z",
      totalUnusedBytes: 0,
      items: [],
    });

    const { payload, content } = await callTool(tools, "find_unused_javascript", {
      url: "https://example.com/",
      device: "mobile",
      minBytes: 2048,
    });

    expect(payload.summary.hasUnusedCode).toBe(false);
    expect(payload.recommendations).toEqual(["No optimization needed - minimal unused code detected"]);
    expect(content[0].text).toContain("No significant unused JavaScript found");
  });

  it("returns an error result when the audit throws", async () => {
    vi.mocked(analysis.findUnusedJavaScript).mockRejectedValue(new Error("chrome exploded"));

    const { isError, payload } = await callTool(tools, "find_unused_javascript", {
      url: "https://example.com/",
      device: "desktop",
      minBytes: 2048,
    });

    expect(isError).toBe(true);
    expect(payload).toMatchObject({ error: true, message: "chrome exploded", url: "https://example.com/" });
  });
});

describe("analyze_resources", () => {
  const resource = (url: string, resourceType: string, sizeKB: number) => ({
    url,
    resourceType,
    transferSize: sizeKB * 1024,
    resourceSize: sizeKB * 1024,
    sizeKB,
    mimeType: `${resourceType}/test`,
  });

  it("derives per-type recommendations from the resource summary", async () => {
    vi.mocked(analysis.analyzeResources).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      fetchTime: "2026-01-01T00:00:00.000Z",
      resources: [resource("https://example.com/a.png", "images", 100)],
      summary: {
        images: { count: 1, totalSize: 102400 },
        javascript: { count: 1, totalSize: 51200 },
        css: { count: 1, totalSize: 10240 },
        fonts: { count: 1, totalSize: 20480 },
      },
    });

    const { payload } = await callTool(tools, "analyze_resources", { url: "https://example.com/", device: "desktop" });

    expect(payload.optimization.priorities).toEqual(["images", "javascript", "css", "fonts"]);
    expect(payload.summary.totalSizeKB).toBe(180);
    expect(payload.resources[0].filename).toBe("a.png");
  });

  it("falls back to a generic recommendation when no known type is present", async () => {
    vi.mocked(analysis.analyzeResources).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      fetchTime: "2026-01-01T00:00:00.000Z",
      resources: [],
      summary: {},
    });

    const { payload } = await callTool(tools, "analyze_resources", { url: "https://example.com/", device: "desktop" });

    expect(payload.optimization.recommendations).toEqual(["Resource usage appears optimized"]);
    expect(payload.optimization.priorities).toEqual([]);
  });

  it("truncates to 50 resources and appends a marker row", async () => {
    const many = Array.from({ length: 60 }, (_, i) => resource(`https://example.com/file-${i}.js`, "javascript", 1));
    vi.mocked(analysis.analyzeResources).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      fetchTime: "2026-01-01T00:00:00.000Z",
      resources: many,
      summary: { javascript: { count: 60, totalSize: 61440 } },
    });

    const { payload } = await callTool(tools, "analyze_resources", { url: "https://example.com/", device: "desktop" });

    expect(payload.resources).toHaveLength(51);
    expect(payload.resources.at(-1)).toMatchObject({ type: "truncated", filename: "... and 10 more resources" });
  });

  it("echoes the applied filters", async () => {
    vi.mocked(analysis.analyzeResources).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      fetchTime: "2026-01-01T00:00:00.000Z",
      resources: [],
      summary: {},
    });

    const { payload } = await callTool(tools, "analyze_resources", {
      url: "https://example.com/",
      device: "desktop",
      resourceTypes: ["images"],
      minSize: 10,
    });

    expect(payload.filters).toEqual({ resourceTypes: ["images"], minSizeKB: 10 });
  });

  it("returns an error result when the audit throws", async () => {
    vi.mocked(analysis.analyzeResources).mockRejectedValue(new Error("network down"));

    const { isError, payload } = await callTool(tools, "analyze_resources", {
      url: "https://example.com/",
      device: "desktop",
    });

    expect(isError).toBe(true);
    expect(payload).toMatchObject({ error: true, message: "network down" });
  });
});
