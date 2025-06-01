/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { registerAnalysisTools } from "./analysis";

// Mock the MCP server
const mockServer = {
  tool: vi.fn(),
};

describe("tools/analysis", () => {
  it("should register analysis tools without errors", () => {
    expect(() => {
      registerAnalysisTools(mockServer as any);
    }).not.toThrow();

    // Verify that tools were registered
    expect(mockServer.tool).toHaveBeenCalledTimes(2); // find_unused_javascript, analyze_resources

    // Verify tool names
    const toolCalls = mockServer.tool.mock.calls;
    expect(toolCalls[0][0]).toBe("find_unused_javascript");
    expect(toolCalls[1][0]).toBe("analyze_resources");
  });
});
