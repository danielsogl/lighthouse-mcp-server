/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { registerResources } from "./resources";

// Mock the MCP server
const mockServer = {
  resource: vi.fn(),
};

describe("resources", () => {
  it("should register all resources without errors", () => {
    expect(() => {
      registerResources(mockServer as any);
    }).not.toThrow();

    // Verify that resources were registered
    expect(mockServer.resource).toHaveBeenCalledTimes(8);

    // Verify resource names
    const resourceCalls = mockServer.resource.mock.calls;
    expect(resourceCalls[0][0]).toBe("core-web-vitals-thresholds");
    expect(resourceCalls[1][0]).toBe("optimization-techniques");
    expect(resourceCalls[2][0]).toBe("wcag-guidelines");
    expect(resourceCalls[3][0]).toBe("seo-best-practices");
    expect(resourceCalls[4][0]).toBe("security-best-practices");
    expect(resourceCalls[5][0]).toBe("budget-guidelines");
    expect(resourceCalls[6][0]).toBe("categories-scoring");
    expect(resourceCalls[7][0]).toBe("framework-guides");
  });

  it("should register resources with correct URIs", () => {
    const resourceCalls = mockServer.resource.mock.calls;

    expect(resourceCalls[0][1]).toBe("lighthouse://performance/core-web-vitals-thresholds");
    expect(resourceCalls[1][1]).toBe("lighthouse://performance/optimization-techniques");
    expect(resourceCalls[2][1]).toBe("lighthouse://accessibility/wcag-guidelines");
    expect(resourceCalls[3][1]).toBe("lighthouse://seo/best-practices");
    expect(resourceCalls[4][1]).toBe("lighthouse://security/best-practices");
    expect(resourceCalls[5][1]).toBe("lighthouse://performance/budget-guidelines");
    expect(resourceCalls[6][1]).toBe("lighthouse://audits/categories-scoring");
    expect(resourceCalls[7][1]).toBe("lighthouse://frameworks/optimization-guides");
  });

  it("should provide valid JSON content for core web vitals thresholds", async () => {
    const resourceCalls = mockServer.resource.mock.calls;
    const coreWebVitalsCallback = resourceCalls[0][2];

    const mockUri = { href: "lighthouse://performance/core-web-vitals-thresholds" };
    const result = await coreWebVitalsCallback(mockUri);

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].uri).toBe(mockUri.href);
    expect(result.contents[0].mimeType).toBe("application/json");

    // Verify the JSON is valid and contains expected structure
    const data = JSON.parse(result.contents[0].text);
    expect(data).toHaveProperty("lcp");
    expect(data).toHaveProperty("fid");
    expect(data).toHaveProperty("cls");
    expect(data.lcp).toHaveProperty("good");
    expect(data.lcp).toHaveProperty("needsImprovement");
    expect(data.lcp).toHaveProperty("poor");
  });

  it("should provide valid JSON content for optimization techniques", async () => {
    const resourceCalls = mockServer.resource.mock.calls;
    const optimizationCallback = resourceCalls[1][2];

    const mockUri = { href: "lighthouse://performance/optimization-techniques" };
    const result = await optimizationCallback(mockUri);

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].mimeType).toBe("application/json");

    // Verify the JSON structure
    const data = JSON.parse(result.contents[0].text);
    expect(data).toHaveProperty("images");
    expect(data).toHaveProperty("javascript");
    expect(data).toHaveProperty("css");
    expect(data).toHaveProperty("caching");
    expect(data.images).toHaveProperty("techniques");
    expect(Array.isArray(data.images.techniques)).toBe(true);
    expect(data.images.techniques.length).toBeGreaterThan(0);
  });

  it("should provide valid JSON content for WCAG guidelines", async () => {
    const resourceCalls = mockServer.resource.mock.calls;
    const wcagCallback = resourceCalls[2][2];

    const mockUri = { href: "lighthouse://accessibility/wcag-guidelines" };
    const result = await wcagCallback(mockUri);

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].mimeType).toBe("application/json");

    // Verify the JSON structure
    const data = JSON.parse(result.contents[0].text);
    expect(data).toHaveProperty("principles");
    expect(data).toHaveProperty("commonIssues");
    expect(data.principles).toHaveProperty("perceivable");
    expect(data.principles).toHaveProperty("operable");
    expect(data.principles).toHaveProperty("understandable");
    expect(data.principles).toHaveProperty("robust");
    expect(Array.isArray(data.commonIssues)).toBe(true);
  });

  it("should provide valid JSON content for framework guides", async () => {
    const resourceCalls = mockServer.resource.mock.calls;
    const frameworkCallback = resourceCalls[7][2];

    const mockUri = { href: "lighthouse://frameworks/optimization-guides" };
    const result = await frameworkCallback(mockUri);

    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].mimeType).toBe("application/json");

    // Verify the JSON structure
    const data = JSON.parse(result.contents[0].text);
    expect(data).toHaveProperty("react");
    expect(data).toHaveProperty("vue");
    expect(data).toHaveProperty("angular");
    expect(data).toHaveProperty("vanilla");
    expect(data.react).toHaveProperty("name");
    expect(data.react).toHaveProperty("optimizations");
    expect(Array.isArray(data.react.optimizations)).toBe(true);
  });
});
