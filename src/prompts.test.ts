/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from "vitest";
import { registerPrompts } from "./prompts.js";

const mockServer = { registerPrompt: vi.fn() };
registerPrompts(mockServer as any);

const prompts = new Map<string, { argsSchema: Record<string, any>; handler: (args: any) => any }>(
  mockServer.registerPrompt.mock.calls.map(([name, config, handler]: any) => [name, { ...config, handler }]),
);

/** Renders a prompt and returns the single user message text it produces. */
function render(name: string, args: Record<string, unknown>) {
  const prompt = prompts.get(name);
  if (!prompt) throw new Error(`prompt ${name} was never registered`);

  const result = prompt.handler(args);
  expect(result.messages).toHaveLength(1);
  expect(result.messages[0].role).toBe("user");

  return result.messages[0].content.text as string;
}

describe("Prompts Registration", () => {
  it("registers every prompt", () => {
    expect([...prompts.keys()]).toEqual([
      "analyze-audit-results",
      "create-performance-plan",
      "compare-audits",
      "seo-recommendations",
      "accessibility-guide",
      "create-performance-budget",
      "optimize-core-web-vitals",
      "optimize-resources",
    ]);
  });

  it("offers the current Lighthouse categories as focus areas", () => {
    const focusArea = prompts.get("analyze-audit-results")!.argsSchema.focusArea;

    expect(focusArea.safeParse("agentic-browsing").success).toBe(true);
    expect(focusArea.safeParse("pwa").success).toBe(false);
  });
});

describe("prompt rendering", () => {
  it("embeds the audit results and focus area", () => {
    const auditResults = JSON.stringify({ score: 90 });
    const text = render("analyze-audit-results", { auditResults, focusArea: "performance" });

    expect(text).toContain(auditResults);
    expect(text).toContain("focusing on performance");
  });

  it("omits the focus area when none is given", () => {
    const text = render("analyze-audit-results", { auditResults: "{}" });

    expect(text).not.toContain("focusing on");
  });

  it("includes optional goals and timeframe only when provided", () => {
    const withOptions = render("create-performance-plan", {
      currentMetrics: "LCP 4s",
      targetGoals: "LCP under 2.5s",
      timeframe: "Q3",
    });
    expect(withOptions).toContain("Target Goals: LCP under 2.5s");
    expect(withOptions).toContain("Timeframe: Q3");

    const bare = render("create-performance-plan", { currentMetrics: "LCP 4s" });
    expect(bare).not.toContain("Target Goals:");
    expect(bare).not.toContain("Timeframe:");
  });

  it("renders both sides of an audit comparison", () => {
    const text = render("compare-audits", {
      beforeAudit: "BEFORE_DATA",
      afterAudit: "AFTER_DATA",
      changesImplemented: "enabled compression",
    });

    expect(text).toContain("BEFORE_DATA");
    expect(text).toContain("AFTER_DATA");
    expect(text).toContain("Changes Implemented: enabled compression");
  });

  it("renders SEO recommendations with optional context", () => {
    const text = render("seo-recommendations", {
      seoAudit: "SEO_DATA",
      websiteType: "e-commerce",
      targetAudience: "DACH",
    });

    expect(text).toContain("SEO_DATA");
    expect(text).toContain("Website Type: e-commerce");
    expect(text).toContain("Target Audience: DACH");
  });

  it("defaults the accessibility guide to WCAG AA", () => {
    const explicit = render("accessibility-guide", { accessibilityAudit: "A11Y", complianceLevel: "AAA" });
    expect(explicit).toContain("Target WCAG Level: AAA");

    const defaulted = render("accessibility-guide", { accessibilityAudit: "A11Y" });
    expect(defaulted).toContain("Target WCAG Level: AA");
  });

  it("renders the performance budget prompt", () => {
    const text = render("create-performance-budget", {
      currentMetrics: "METRICS",
      businessGoals: "conversion",
      userBase: "mobile-first",
    });

    expect(text).toContain("METRICS");
    expect(text).toContain("Business Goals: conversion");
    expect(text).toContain("User Base: mobile-first");
  });

  it("renders the Core Web Vitals prompt with stack context", () => {
    const text = render("optimize-core-web-vitals", {
      coreWebVitals: "CWV",
      framework: "Angular",
      constraints: "no CDN",
    });

    expect(text).toContain("CWV");
    expect(text).toContain("Technology Stack: Angular");
    expect(text).toContain("Constraints: no CDN");
    // INP replaced FID as the responsiveness vital.
    expect(text).toContain("INP");
    expect(text).not.toContain("First Input Delay");
  });

  it("renders the resource optimization prompt", () => {
    const text = render("optimize-resources", {
      resourceAnalysis: "RESOURCES",
      loadingStrategy: "lazy",
      criticalUserJourneys: "checkout",
    });

    expect(text).toContain("RESOURCES");
  });
});
