import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { LighthouseResult, LighthouseAuditResult } from "./types";

// Helper function to run Lighthouse audit
export async function runLighthouseAudit(
  url: string,
  categories?: string[],
  device: "desktop" | "mobile" = "desktop",
  throttling = false,
): Promise<LighthouseAuditResult> {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const options: {
      logLevel: "info";
      output: "json";
      onlyCategories?: string[];
      port: number;
      formFactor: "desktop" | "mobile";
      screenEmulation: {
        mobile: boolean;
        width: number;
        height: number;
        deviceScaleFactor: number;
        disabled: boolean;
      };
      throttling: {
        rttMs: number;
        throughputKbps: number;
        cpuSlowdownMultiplier: number;
      };
    } = {
      logLevel: "info" as const,
      output: "json",
      onlyCategories: categories,
      port: chrome.port,
      formFactor: device,
      screenEmulation: {
        mobile: device !== "desktop",
        width: device === "desktop" ? 1350 : 360,
        height: device === "desktop" ? 940 : 640,
        deviceScaleFactor: 1,
        disabled: false,
      },
      throttling: throttling
        ? {
            rttMs: 150,
            throughputKbps: 1638.4,
            cpuSlowdownMultiplier: 4,
          }
        : {
            rttMs: 0,
            throughputKbps: 10 * 1024,
            cpuSlowdownMultiplier: 1,
          },
    };

    const runnerResult = (await lighthouse(url, options)) as LighthouseResult;

    if (!runnerResult) {
      throw new Error("Failed to run Lighthouse audit");
    }

    const { lhr } = runnerResult;

    // Format category scores
    const auditCategories: Record<
      string,
      {
        title: string;
        score: number;
        description: string;
      }
    > = {};
    for (const [key, category] of Object.entries(lhr.categories)) {
      auditCategories[key] = {
        title: category.title,
        score: Math.round((category.score || 0) * 100),
        description: category.description,
      };
    }

    // Extract key metrics
    const metrics: Record<
      string,
      {
        title: string;
        value: number;
        displayValue: string;
        score: number | null;
      }
    > = {};
    if (lhr.audits) {
      const keyMetrics = [
        "first-contentful-paint",
        "largest-contentful-paint",
        "total-blocking-time",
        "cumulative-layout-shift",
        "speed-index",
        "interactive",
      ];

      for (const metric of keyMetrics) {
        const audit = lhr.audits[metric];
        if (audit) {
          metrics[metric] = {
            title: audit.title,
            value: audit.numericValue || 0,
            displayValue: audit.displayValue || "N/A",
            score: audit.score !== null ? Math.round((audit.score || 0) * 100) : null,
          };
        }
      }
    }

    return {
      url: lhr.finalDisplayedUrl,
      fetchTime: lhr.fetchTime,
      version: lhr.lighthouseVersion,
      userAgent: lhr.userAgent,
      device,
      categories: auditCategories,
      metrics,
    };
  } finally {
    await chrome.kill();
  }
}

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
  threshold?: { lcp?: number; fid?: number; cls?: number },
) {
  const result = await runLighthouseAudit(url, ["performance"], device);

  const coreWebVitals = {
    lcp: result.metrics["largest-contentful-paint"],
    fcp: result.metrics["first-contentful-paint"],
    cls: result.metrics["cumulative-layout-shift"],
    tbt: result.metrics["total-blocking-time"], // TBT is used as FID proxy in lab tests
  };

  // Check against thresholds if provided
  const thresholdResults = threshold
    ? {
        lcp: threshold.lcp ? (coreWebVitals.lcp?.value || 0) / 1000 <= threshold.lcp : null,
        fid: threshold.fid ? (coreWebVitals.tbt?.value || 0) <= threshold.fid : null,
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

// Helper function to get accessibility score and details
export async function getAccessibilityScore(
  url: string,
  device: "desktop" | "mobile" = "desktop",
  includeDetails = false,
) {
  const result = await runLighthouseAudit(url, ["accessibility"], device);

  const accessibilityData = {
    url: result.url,
    device: result.device,
    accessibilityScore: result.categories.accessibility?.score || 0,
    fetchTime: result.fetchTime,
  };

  if (includeDetails) {
    // Get detailed accessibility audit results
    const chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
    });

    try {
      const options = {
        logLevel: "info" as const,
        output: "json" as const,
        onlyCategories: ["accessibility"],
        port: chrome.port,
        formFactor: device,
        screenEmulation: {
          mobile: device !== "desktop",
          width: device === "desktop" ? 1350 : 360,
          height: device === "desktop" ? 940 : 640,
          deviceScaleFactor: 1,
          disabled: false,
        },
      };

      const runnerResult = (await lighthouse(url, options)) as LighthouseResult;
      const { lhr } = runnerResult;

      const accessibilityAudits = Object.entries(lhr.audits)
        .filter(([key]) => lhr.categories.accessibility?.auditRefs?.some((ref) => ref.id === key))
        .map(([key, audit]) => ({
          id: key,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          scoreDisplayMode: audit.scoreDisplayMode,
          displayValue: audit.displayValue,
        }));

      return {
        ...accessibilityData,
        audits: accessibilityAudits,
      };
    } finally {
      await chrome.kill();
    }
  }

  return accessibilityData;
}

// Helper function to get SEO analysis
export async function getSeoAnalysis(url: string, device: "desktop" | "mobile" = "desktop", includeDetails = false) {
  const result = await runLighthouseAudit(url, ["seo"], device);

  const seoData = {
    url: result.url,
    device: result.device,
    seoScore: result.categories.seo?.score || 0,
    fetchTime: result.fetchTime,
  };

  if (includeDetails) {
    const chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
    });

    try {
      const options = {
        logLevel: "info" as const,
        output: "json" as const,
        onlyCategories: ["seo"],
        port: chrome.port,
        formFactor: device,
        screenEmulation: {
          mobile: device !== "desktop",
          width: device === "desktop" ? 1350 : 360,
          height: device === "desktop" ? 940 : 640,
          deviceScaleFactor: 1,
          disabled: false,
        },
      };

      const runnerResult = (await lighthouse(url, options)) as LighthouseResult;
      const { lhr } = runnerResult;

      const seoAudits = Object.entries(lhr.audits)
        .filter(([key]) => lhr.categories.seo?.auditRefs?.some((ref) => ref.id === key))
        .map(([key, audit]) => ({
          id: key,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          scoreDisplayMode: audit.scoreDisplayMode,
          displayValue: audit.displayValue,
        }));

      return {
        ...seoData,
        audits: seoAudits,
      };
    } finally {
      await chrome.kill();
    }
  }

  return seoData;
}

// Helper function to check PWA readiness
export async function checkPwaReadiness(url: string, device: "desktop" | "mobile" = "desktop", includeDetails = false) {
  const result = await runLighthouseAudit(url, ["pwa"], device);

  const pwaData = {
    url: result.url,
    device: result.device,
    pwaScore: result.categories.pwa?.score || 0,
    fetchTime: result.fetchTime,
  };

  if (includeDetails) {
    const chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
    });

    try {
      const options = {
        logLevel: "info" as const,
        output: "json" as const,
        onlyCategories: ["pwa"],
        port: chrome.port,
        formFactor: device,
        screenEmulation: {
          mobile: device !== "desktop",
          width: device === "desktop" ? 1350 : 360,
          height: device === "desktop" ? 940 : 640,
          deviceScaleFactor: 1,
          disabled: false,
        },
      };

      const runnerResult = (await lighthouse(url, options)) as LighthouseResult;
      const { lhr } = runnerResult;

      const pwaAudits = Object.entries(lhr.audits)
        .filter(([key]) => lhr.categories.pwa?.auditRefs?.some((ref) => ref.id === key))
        .map(([key, audit]) => ({
          id: key,
          title: audit.title,
          description: audit.description,
          score: audit.score,
          scoreDisplayMode: audit.scoreDisplayMode,
          displayValue: audit.displayValue,
        }));

      return {
        ...pwaData,
        audits: pwaAudits,
      };
    } finally {
      await chrome.kill();
    }
  }

  return pwaData;
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

  // Check metrics
  const metricChecks = [
    { key: "firstContentfulPaint", metric: "first-contentful-paint", unit: "ms" },
    { key: "largestContentfulPaint", metric: "largest-contentful-paint", unit: "ms" },
    { key: "totalBlockingTime", metric: "total-blocking-time", unit: "ms" },
    { key: "cumulativeLayoutShift", metric: "cumulative-layout-shift", unit: "score" },
    { key: "speedIndex", metric: "speed-index", unit: "ms" },
  ];

  for (const { key, metric, unit } of metricChecks) {
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
export async function getLcpOpportunities(url: string, device: "desktop" | "mobile" = "desktop", threshold = 2.5) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const options = {
      logLevel: "info" as const,
      output: "json" as const,
      onlyCategories: ["performance"],
      port: chrome.port,
      formFactor: device,
      screenEmulation: {
        mobile: device !== "desktop",
        width: device === "desktop" ? 1350 : 360,
        height: device === "desktop" ? 940 : 640,
        deviceScaleFactor: 1,
        disabled: false,
      },
    };

    const runnerResult = (await lighthouse(url, options)) as LighthouseResult;
    const { lhr } = runnerResult;

    const lcpValue = (lhr.audits["largest-contentful-paint"]?.numericValue || 0) / 1000;
    const needsImprovement = lcpValue > threshold;

    // Get LCP-related opportunities
    const lcpOpportunities = [
      "render-blocking-resources",
      "unused-css-rules",
      "unused-javascript",
      "modern-image-formats",
      "uses-optimized-images",
      "efficient-animated-content",
      "preload-lcp-image",
      "uses-text-compression",
    ];

    const opportunities = lcpOpportunities
      .map((auditId) => {
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
      })
      .filter(Boolean);

    return {
      url: lhr.finalDisplayedUrl,
      device,
      lcpValue,
      threshold,
      needsImprovement,
      opportunities,
      fetchTime: lhr.fetchTime,
    };
  } finally {
    await chrome.kill();
  }
}

// Helper function to find unused JavaScript
export async function findUnusedJavaScript(url: string, device: "desktop" | "mobile" = "desktop", minBytes = 2048) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const options = {
      logLevel: "info" as const,
      output: "json" as const,
      onlyCategories: ["performance"],
      port: chrome.port,
      formFactor: device,
      screenEmulation: {
        mobile: device !== "desktop",
        width: device === "desktop" ? 1350 : 360,
        height: device === "desktop" ? 940 : 640,
        deviceScaleFactor: 1,
        disabled: false,
      },
    };

    const runnerResult = (await lighthouse(url, options)) as LighthouseResult;
    const { lhr } = runnerResult;

    const unusedJsAudit = lhr.audits["unused-javascript"];

    if (!unusedJsAudit || !unusedJsAudit.details) {
      return {
        url: lhr.finalDisplayedUrl,
        device,
        totalUnusedBytes: 0,
        items: [],
        fetchTime: lhr.fetchTime,
      };
    }

    // Filter items by minimum bytes
    const items = (unusedJsAudit.details.items || [])
      .filter((item: Record<string, unknown>) => (item.wastedBytes as number) >= minBytes)
      .map((item: Record<string, unknown>) => ({
        url: item.url as string,
        totalBytes: item.totalBytes as number,
        wastedBytes: item.wastedBytes as number,
        wastedPercent: Math.round(((item.wastedBytes as number) / (item.totalBytes as number)) * 100),
      }));

    const totalUnusedBytes = items.reduce((sum: number, item: { wastedBytes: number }) => sum + item.wastedBytes, 0);

    return {
      url: lhr.finalDisplayedUrl,
      device,
      totalUnusedBytes,
      items,
      fetchTime: lhr.fetchTime,
    };
  } finally {
    await chrome.kill();
  }
}

// Helper function to analyze resources
export async function analyzeResources(
  url: string,
  device: "desktop" | "mobile" = "desktop",
  resourceTypes?: string[],
  minSize?: number,
) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const options = {
      logLevel: "info" as const,
      output: "json" as const,
      onlyCategories: ["performance"],
      port: chrome.port,
      formFactor: device,
      screenEmulation: {
        mobile: device !== "desktop",
        width: device === "desktop" ? 1350 : 360,
        height: device === "desktop" ? 940 : 640,
        deviceScaleFactor: 1,
        disabled: false,
      },
    };

    const runnerResult = (await lighthouse(url, options)) as LighthouseResult;
    const { lhr } = runnerResult;

    // Get resource summary from network-requests audit
    const networkAudit = lhr.audits["network-requests"];

    if (!networkAudit || !networkAudit.details) {
      return {
        url: lhr.finalDisplayedUrl,
        device,
        resources: [],
        summary: {},
        fetchTime: lhr.fetchTime,
      };
    }

    const resources = (networkAudit.details.items || [])
      .map((item: Record<string, unknown>) => {
        const sizeKB = ((item.transferSize as number) || 0) / 1024;
        let resourceType = "other";

        if (item.resourceType) {
          resourceType = (item.resourceType as string).toLowerCase();
        } else if (item.mimeType) {
          const mimeType = item.mimeType as string;
          if (mimeType.startsWith("image/")) resourceType = "images";
          else if (mimeType.includes("javascript")) resourceType = "javascript";
          else if (mimeType.includes("css")) resourceType = "css";
          else if (mimeType.includes("font")) resourceType = "fonts";
        }

        return {
          url: item.url as string,
          resourceType,
          transferSize: (item.transferSize as number) || 0,
          resourceSize: (item.resourceSize as number) || 0,
          sizeKB: Math.round(sizeKB * 100) / 100,
          mimeType: item.mimeType as string,
        };
      })
      .filter((resource: { sizeKB: number; resourceType: string }) => {
        if (minSize && resource.sizeKB < minSize) return false;
        if (resourceTypes && !resourceTypes.includes(resource.resourceType)) return false;
        return true;
      });

    // Create summary by resource type
    const summary = resources.reduce(
      (
        acc: Record<string, { count: number; totalSize: number }>,
        resource: { resourceType: string; transferSize: number },
      ) => {
        if (!acc[resource.resourceType]) {
          acc[resource.resourceType] = { count: 0, totalSize: 0 };
        }
        acc[resource.resourceType].count++;
        acc[resource.resourceType].totalSize += resource.transferSize;
        return acc;
      },
      {},
    );

    return {
      url: lhr.finalDisplayedUrl,
      device,
      resources,
      summary,
      fetchTime: lhr.fetchTime,
    };
  } finally {
    await chrome.kill();
  }
}

// Helper function to get security audit
export async function getSecurityAudit(url: string, device: "desktop" | "mobile" = "desktop", checks?: string[]) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const options = {
      logLevel: "info" as const,
      output: "json" as const,
      onlyCategories: ["best-practices"],
      port: chrome.port,
      formFactor: device,
      screenEmulation: {
        mobile: device !== "desktop",
        width: device === "desktop" ? 1350 : 360,
        height: device === "desktop" ? 940 : 640,
        deviceScaleFactor: 1,
        disabled: false,
      },
    };

    const runnerResult = (await lighthouse(url, options)) as LighthouseResult;
    const { lhr } = runnerResult;

    // Security-related audits
    const securityAudits = [
      "is-on-https",
      "uses-http2",
      "no-vulnerable-libraries",
      "csp-xss",
      "external-anchors-use-rel-noopener",
    ];

    const auditResults = securityAudits
      .map((auditId) => {
        const audit = lhr.audits[auditId];
        if (audit && (!checks || checks.some((check) => auditId.includes(check)))) {
          return {
            id: auditId,
            title: audit.title,
            description: audit.description,
            score: audit.score,
            scoreDisplayMode: audit.scoreDisplayMode,
            displayValue: audit.displayValue,
          };
        }
        return null;
      })
      .filter(Boolean);

    const overallScore =
      auditResults.reduce((sum, audit: { score: number | null } | null) => sum + (audit?.score || 0), 0) /
      auditResults.length;

    return {
      url: lhr.finalDisplayedUrl,
      device,
      overallScore: Math.round(overallScore * 100),
      audits: auditResults,
      fetchTime: lhr.fetchTime,
    };
  } finally {
    await chrome.kill();
  }
}
