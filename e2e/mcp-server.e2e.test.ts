import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { startFixtureServer } from "./server.js";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Every tool the server is expected to expose after the Lighthouse 13 update. */
const EXPECTED_TOOLS = [
  "run_audit",
  "get_accessibility_score",
  "get_seo_analysis",
  "get_performance_score",
  "get_core_web_vitals",
  "compare_mobile_desktop",
  "check_performance_budget",
  "get_lcp_opportunities",
  "find_unused_javascript",
  "analyze_resources",
  "get_security_audit",
];

let client: Client;
let transport: StdioClientTransport;
let fixture: Awaited<ReturnType<typeof startFixtureServer>>;

/** Calls a tool and returns the raw text content, which is not JSON for validation errors. */
async function callToolRaw(name: string, args: Record<string, unknown>) {
  const result = (await client.callTool({ name, arguments: args })) as {
    isError?: boolean;
    content: { type: string; text: string }[];
    structuredContent?: Record<string, unknown>;
  };
  return {
    isError: result.isError === true,
    message: result.content.find((part) => part.type === "text")?.text ?? "",
    structuredContent: result.structuredContent,
  };
}

/** Calls a tool and parses the JSON payload the server encodes into its text content. */
async function callTool(name: string, args: Record<string, unknown>) {
  const { isError, message, structuredContent } = await callToolRaw(name, args);
  return { isError, payload: JSON.parse(message), structuredContent };
}

beforeAll(async () => {
  fixture = await startFixtureServer();

  // Drive the built artifact, so the e2e covers what actually ships.
  transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(repoRoot, "dist", "index.js")],
    cwd: repoRoot,
  });

  client = new Client({ name: "lighthouse-mcp-e2e", version: "1.0.0" });
  await client.connect(transport);
}, 120_000);

afterAll(async () => {
  await client?.close();
  await fixture?.close();
});

describe("MCP protocol surface", () => {
  it("exposes exactly the expected tools", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name).sort()).toEqual([...EXPECTED_TOOLS].sort());
  });

  it("no longer exposes the removed PWA tool", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).not.toContain("check_pwa_readiness");
  });

  it("annotates every tool as read-only and open-world with a display title", async () => {
    const { tools } = await client.listTools();

    for (const tool of tools) {
      expect(tool.title, `${tool.name} is missing a title`).toBeTruthy();
      expect(tool.annotations?.readOnlyHint, `${tool.name} is not marked read-only`).toBe(true);
      expect(tool.annotations?.openWorldHint, `${tool.name} is not marked open-world`).toBe(true);
    }
  });

  it("advertises a JSON Schema for every tool's output", async () => {
    const { tools } = await client.listTools();

    for (const tool of tools) {
      expect(tool.outputSchema, `${tool.name} has no outputSchema`).toBeDefined();
      expect(tool.outputSchema?.type).toBe("object");
    }
  });

  it("rejects the removed 'pwa' category through schema validation", async () => {
    const { isError, message } = await callToolRaw("run_audit", { url: fixture.url, categories: ["pwa"] });

    expect(isError).toBe(true);
    expect(message).toContain("validation error");
  });

  it("rejects non-HTTP URLs through schema validation", async () => {
    const { isError, message } = await callToolRaw("run_audit", { url: "file:///etc/passwd" });

    expect(isError).toBe(true);
    expect(message).toContain("Must be a valid HTTP or HTTPS URL");
  });

  it("exposes prompts and resources", async () => {
    const { prompts } = await client.listPrompts();
    const { resources } = await client.listResources();

    expect(prompts.length).toBeGreaterThan(0);
    expect(resources.length).toBeGreaterThan(0);
  });

  it("serves the Core Web Vitals threshold resource using INP rather than FID", async () => {
    const result = await client.readResource({ uri: "lighthouse://performance/core-web-vitals-thresholds" });
    const data = JSON.parse(result.contents[0].text as string);

    expect(data).toHaveProperty("inp");
    expect(data).not.toHaveProperty("fid");
    expect(data.inp.good.max).toBe(200);
  });
});

describe("real Lighthouse audits", () => {
  it("runs a full audit and returns only categories that still exist", async () => {
    const { isError, payload, structuredContent } = await callTool("run_audit", { url: fixture.url });

    expect(isError, JSON.stringify(payload)).toBe(false);
    // agentic-browsing is the category Lighthouse 13 added; pwa is the one it removed.
    expect(Object.keys(payload.data.categories).sort()).toEqual([
      "accessibility",
      "agentic-browsing",
      "best-practices",
      "performance",
      "seo",
    ]);
    expect(payload.data.categories).not.toHaveProperty("pwa");
    expect(payload.data.version).toMatch(/^13\./);
    expect(payload.data.categories.performance.score).toBeGreaterThan(0);
    // Clients get the same payload as validated structured data, not just JSON text.
    expect(structuredContent).toEqual(payload);
  }, 180_000);

  it("resolves the Lighthouse 13 insight audits behind get_lcp_opportunities", async () => {
    const { isError, payload } = await callTool("get_lcp_opportunities", { url: fixture.url });

    expect(isError, JSON.stringify(payload)).toBe(false);
    expect(payload.data.lcpValue).toBeGreaterThan(0);

    // A stale audit ID silently yields no opportunities, which is exactly the
    // regression this asserts against: the insight audits must resolve in a real LHR.
    const ids = payload.data.opportunities.map((item: { id: string }) => item.id);
    expect(ids.every((id: string) => id.endsWith("-insight") || id.startsWith("unused-"))).toBe(true);
  }, 180_000);

  it("resolves the current best-practices security audits", async () => {
    const { isError, payload } = await callTool("get_security_audit", { url: fixture.url });

    expect(isError, JSON.stringify(payload)).toBe(false);

    const ids = payload.data.audits.map((audit: { id: string }) => audit.id);
    expect(ids).toContain("is-on-https");
    expect(ids.length).toBeGreaterThanOrEqual(5);

    // None of the audits Lighthouse removed may come back.
    for (const removed of ["uses-http2", "no-vulnerable-libraries", "external-anchors-use-rel-noopener"]) {
      expect(ids).not.toContain(removed);
    }
    expect(payload.data.overallScore).not.toBeNaN();
  }, 180_000);

  it("reports INP alongside the lab metrics in Core Web Vitals", async () => {
    const { isError, payload } = await callTool("get_core_web_vitals", { url: fixture.url });

    expect(isError, JSON.stringify(payload)).toBe(false);

    const vitals = payload.data.coreWebVitals;
    expect(Object.keys(vitals)).toEqual(expect.arrayContaining(["lcp", "fcp", "cls", "inp", "tbt"]));
    expect(vitals).not.toHaveProperty("fid");
    // The tool reports Lighthouse's human-readable displayValue, e.g. "0.4 s".
    expect(vitals.lcp.value).not.toBe("N/A");
    expect(vitals.lcp.score).toBeGreaterThan(0);
  }, 180_000);

  it("surfaces an unreachable page as an error rather than a zero score", async () => {
    // Port 1 is reserved and refuses connections, so Lighthouse fails to load the page.
    // Lighthouse resolves with a runtimeError instead of rejecting, so this asserts the
    // server does not pass that off as a successful audit that merely scored zero.
    const { isError, payload } = await callTool("get_performance_score", { url: "http://127.0.0.1:1/" });

    expect(isError).toBe(true);
    expect(payload.error).toBeTruthy();
    expect(payload.message).toMatch(/could not audit/i);
    expect(payload).not.toHaveProperty("data.performanceScore");
  }, 180_000);
});
