/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { registerSecurityTools } from "./security";

// Mock the MCP server
const mockServer = {
  tool: vi.fn(),
};

describe("tools/security", () => {
  it("should register security tools without errors", () => {
    expect(() => {
      registerSecurityTools(mockServer as any);
    }).not.toThrow();

    // Verify that tools were registered
    expect(mockServer.tool).toHaveBeenCalledTimes(1); // get_security_audit

    // Verify tool names
    const toolCalls = mockServer.tool.mock.calls;
    expect(toolCalls[0][0]).toBe("get_security_audit");
  });
});
