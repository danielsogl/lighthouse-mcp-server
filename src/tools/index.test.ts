import { describe, it, expect } from "vitest";
import { registerAuditTools, registerPerformanceTools, registerAnalysisTools, registerSecurityTools } from "./index.js";

describe("tools/index", () => {
  it("should export all tool registration functions", () => {
    expect(typeof registerAuditTools).toBe("function");
    expect(typeof registerPerformanceTools).toBe("function");
    expect(typeof registerAnalysisTools).toBe("function");
    expect(typeof registerSecurityTools).toBe("function");
  });
});
