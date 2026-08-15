import { runLighthouseAudit, runRawLighthouseAudit } from "./lighthouse-core.js";
import type { LighthouseAuditResult } from "./types.js";
import { BUDGET_METRIC_MAPPINGS, LCP_OPPORTUNITIES, DEFAULTS } from "./lighthouse-constants.js";

// Helper function to get performance score only
export async function getPerformanceScore(url: string, device: "desktop" | "mobile" = "desktop") {
  const result = await runLighthouseAudit(url, ["performance"], device);
  return {
    url: result.url,
    device: result.device,
    performanceScore: result.categories.performance?.score || 0,
    metrics: result.metrics,
    fetchTime: result.fetchTime,
  };
}

// Helper function to get Core Web Vitals
export async function getCoreWebVitals(
  url: string,
  device: "desktop" | "mobile" = "desktop",
  threshold?: { lcp?: number; inp?: number; cls?: number },
) {
  const result = await runLighthouseAudit(url, ["performance"], device);

  // Indexing the metrics record yields undefined for any metric Lighthouse did not
  // produce, which the record's own type does not express. Spelling that out here keeps
  // callers honest — they already guard with optional chaining.
  const coreWebVitals: Record<string, LighthouseAuditResult["metrics"][string] | undefined> = {
    lcp: result.metrics["largest-contentful-paint"],
    fcp: result.metrics["first-contentful-paint"],
    cls: result.metrics["cumulative-layout-shift"],
    // INP replaced FID as a Core Web Vital in March 2024. A cold lab load has no user
    // interaction, so INP is usually absent and TBT stays the lab proxy for responsiveness.
    inp: result.metrics["interaction-to-next-paint"],
    tbt: result.metrics["total-blocking-time"],
  };

  // Check against thresholds if provided
  const thresholdResults = threshold
    ? {
        lcp: threshold.lcp ? (coreWebVitals.lcp?.value || 0) / 1000 <= threshold.lcp : null,
        inp: threshold.inp ? (coreWebVitals.inp?.value ?? coreWebVitals.tbt?.value ?? 0) <= threshold.inp : null,
        cls: threshold.cls ? (coreWebVitals.cls?.value || 0) <= threshold.cls : null,
      }
    : null;

  return {
    url: result.url,
    device: result.device,
    coreWebVitals,
    thresholdResults,
    fetchTime: result.fetchTime,
  };
}

// Helper function to compare mobile vs desktop
export async function compareMobileDesktop(url: string, categories?: string[], throttling = false) {
  // Run audits sequentially to avoid Chrome port conflicts
  const mobileResult = await runLighthouseAudit(url, categories, "mobile", throttling);
  const desktopResult = await runLighthouseAudit(url, categories, "desktop", throttling);

  const comparison = {
    url: mobileResult.url,
    mobile: {
      categories: mobileResult.categories,
      metrics: mobileResult.metrics,
    },
    desktop: {
      categories: desktopResult.categories,
      metrics: desktopResult.metrics,
    },
    differences: {} as Record<string, { mobile: number; desktop: number; difference: number }>,
  };

  // Calculate differences for categories
  for (const [key, mobileCategory] of Object.entries(mobileResult.categories)) {
    const desktopCategory = desktopResult.categories[key];
    if (desktopCategory) {
      comparison.differences[key] = {
        mobile: mobileCategory.score,
        desktop: desktopCategory.score,
        difference: desktopCategory.score - mobileCategory.score,
      };
    }
  }

  return comparison;
}

// Helper function to check performance budget
export async function checkPerformanceBudget(
  url: string,
  device: "desktop" | "mobile" = "desktop",
  budget: {
    performanceScore?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    totalBlockingTime?: number;
    cumulativeLayoutShift?: number;
    speedIndex?: number;
  },
) {
  const result = await runLighthouseAudit(url, ["performance"], device);

  const budgetResults = {
    url: result.url,
    device: result.device,
    fetchTime: result.fetchTime,
    results: {} as Record<string, { actual: number; budget: number; passed: boolean; unit: string }>,
    overallPassed: true,
  };

  // Check performance score
  if (budget.performanceScore !== undefined) {
    const actual = result.categories.performance?.score || 0;
    const passed = actual >= budget.performanceScore;
    budgetResults.results.performanceScore = {
      actual,
      budget: budget.performanceScore,
      passed,
      unit: "score",
    };
    if (!passed) budgetResults.overallPassed = false;
  }

  // Check metrics using constants
  for (const { key, metric, unit } of BUDGET_METRIC_MAPPINGS) {
    const budgetValue = budget[key as keyof typeof budget];
    if (budgetValue !== undefined) {
      const actual = result.metrics[metric]?.value || 0;
      const passed = actual <= budgetValue;
      budgetResults.results[key] = {
        actual,
        budget: budgetValue,
        passed,
        unit,
      };
      if (!passed) budgetResults.overallPassed = false;
    }
  }

  return budgetResults;
}

// Helper function to get LCP optimization opportunities
export async function getLcpOpportunities(
  url: string,
  device: "desktop" | "mobile" = "desktop",
  threshold = DEFAULTS.LCP_THRESHOLD,
) {
  const runnerResult = await runRawLighthouseAudit(url, ["performance"], device);
  const { lhr } = runnerResult;

  const lcpValue = (lhr.audits["largest-contentful-paint"]?.numericValue || 0) / 1000;
  const needsImprovement = lcpValue > threshold;

  const opportunities = LCP_OPPORTUNITIES.map((auditId) => {
    const audit = lhr.audits[auditId];
    if (audit && audit.score !== null && audit.score < 1) {
      return {
        id: auditId,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        displayValue: audit.displayValue,
        numericValue: audit.numericValue,
      };
    }
    return null;
  }).filter(Boolean);

  return {
    url: lhr.finalDisplayedUrl,
    device,
    lcpValue,
    threshold,
    needsImprovement,
    opportunities,
    fetchTime: lhr.fetchTime,
  };
}
