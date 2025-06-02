/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { registerPrompts } from "./prompts";

// Mock the MCP server
const mockServer = {
  prompt: vi.fn(),
};

describe("Prompts Registration", () => {
  it("should register prompts without errors", () => {
    expect(() => {
      registerPrompts(mockServer as any);
    }).not.toThrow();

    // Verify that prompts were registered
    expect(mockServer.prompt).toHaveBeenCalledTimes(8);

    // Verify prompt names
    const promptCalls = mockServer.prompt.mock.calls;
    expect(promptCalls[0][0]).toBe("analyze-audit-results");
    expect(promptCalls[1][0]).toBe("create-performance-plan");
    expect(promptCalls[2][0]).toBe("compare-audits");
    expect(promptCalls[3][0]).toBe("seo-recommendations");
    expect(promptCalls[4][0]).toBe("accessibility-guide");
    expect(promptCalls[5][0]).toBe("create-performance-budget");
    expect(promptCalls[6][0]).toBe("optimize-core-web-vitals");
    expect(promptCalls[7][0]).toBe("optimize-resources");
  });
});
