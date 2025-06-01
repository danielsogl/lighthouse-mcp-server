/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { registerAuditTools } from "./audit";

// Mock the MCP server
const mockServer = {
  tool: vi.fn(),
};

describe("tools/audit", () => {
  it("should register audit tools without errors", () => {
    expect(() => {
      registerAuditTools(mockServer as any);
    }).not.toThrow();

    // Verify that tools were registered
    expect(mockServer.tool).toHaveBeenCalledTimes(4); // run_audit, get_accessibility_score, get_seo_analysis, check_pwa_readiness

    // Verify tool names
    const toolCalls = mockServer.tool.mock.calls;
    expect(toolCalls[0][0]).toBe("run_audit");
    expect(toolCalls[1][0]).toBe("get_accessibility_score");
    expect(toolCalls[2][0]).toBe("get_seo_analysis");
    expect(toolCalls[3][0]).toBe("check_pwa_readiness");
  });
});
