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
