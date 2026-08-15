import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerSecurityTools } from "./security.js";
import { collectTools, callTool } from "./harness.js";
import * as analysis from "../lighthouse-analysis.js";

vi.mock("../lighthouse-analysis.js", () => ({ getSecurityAudit: vi.fn() }));

const tools = collectTools(registerSecurityTools);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("tools/security", () => {
  it("registers the security tool as read-only with a title", () => {
    expect([...tools.keys()]).toEqual(["get_security_audit"]);
    expect(tools.get("get_security_audit")?.config.title).toBe("Get Security Audit");
    expect(tools.get("get_security_audit")?.config.annotations).toEqual({ readOnlyHint: true, openWorldHint: true });
  });

  it("classifies each audit as pass, fail or warning", async () => {
    vi.mocked(analysis.getSecurityAudit).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      overallScore: 67,
      fetchTime: "2026-01-01T00:00:00.000Z",
      audits: [
        { id: "is-on-https", title: "HTTPS", description: "Uses HTTPS", score: 1, displayValue: "Passed" },
        { id: "has-hsts", title: "HSTS", description: "Uses HSTS", score: 0, displayValue: undefined },
        { id: "csp-xss", title: "CSP", description: undefined, score: null, displayValue: undefined },
      ],
    });

    const { isError, payload } = await callTool(tools, "get_security_audit", {
      url: "https://example.com/",
      device: "desktop",
    });

    expect(isError).toBe(false);
    expect(payload.data.audits.map((a: { status: string }) => a.status)).toEqual(["pass", "fail", "warning"]);
    expect(payload.data.passedAudits).toBe(1);
    expect(payload.data.failedAudits).toBe(1);
    expect(payload.data.auditCount).toBe(3);
    // Null scores stay null; zero-to-one scores scale to percentages.
    expect(payload.data.audits[2]).toMatchObject({ score: null, description: "N/A", displayValue: "N/A" });
    expect(payload.data.audits[0].score).toBe(100);
  });

  it("passes the requested checks through to the analysis layer", async () => {
    vi.mocked(analysis.getSecurityAudit).mockResolvedValue({
      url: "https://example.com/",
      device: "desktop",
      overallScore: 0,
      fetchTime: "2026-01-01T00:00:00.000Z",
      audits: [],
    });

    await callTool(tools, "get_security_audit", {
      url: "https://example.com/",
      device: "desktop",
      checks: ["https", "hsts"],
    });

    expect(analysis.getSecurityAudit).toHaveBeenCalledWith("https://example.com/", "desktop", ["https", "hsts"]);
  });

  it("returns an error result when the audit throws", async () => {
    vi.mocked(analysis.getSecurityAudit).mockRejectedValue(new Error("tls failure"));

    const { isError, payload } = await callTool(tools, "get_security_audit", { url: "https://example.com/" });

    expect(isError).toBe(true);
    expect(payload.error).toBe("Security audit failed");
    expect(payload.message).toBe("tls failure");
    expect(payload.device).toBe("desktop");
  });
});
