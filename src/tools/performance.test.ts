/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { registerPerformanceTools } from "./performance";

// Mock the MCP server
const mockServer = {
  tool: vi.fn(),
};

describe("tools/performance", () => {
  it("should register performance tools without errors", () => {
    expect(() => {
      registerPerformanceTools(mockServer as any);
    }).not.toThrow();

    // Verify that tools were registered
    expect(mockServer.tool).toHaveBeenCalledTimes(5); // get_performance_score, get_core_web_vitals, compare_mobile_desktop, check_performance_budget, get_lcp_opportunities

    // Verify tool names
    const toolCalls = mockServer.tool.mock.calls;
    expect(toolCalls[0][0]).toBe("get_performance_score");
    expect(toolCalls[1][0]).toBe("get_core_web_vitals");
    expect(toolCalls[2][0]).toBe("compare_mobile_desktop");
    expect(toolCalls[3][0]).toBe("check_performance_budget");
    expect(toolCalls[4][0]).toBe("get_lcp_opportunities");
  });
});
