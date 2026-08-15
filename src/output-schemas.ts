import { z } from "zod";

/**
 * Output schemas for the tools. Declaring these lets the SDK hand clients validated
 * `structuredContent` instead of a JSON string they have to parse themselves.
 *
 * The SDK validates every successful result against these at runtime (error results are
 * exempt), so a schema that drifts from what a handler actually returns surfaces as a
 * failing test rather than a silent mismatch.
 */

/**
 * A Lighthouse metric as the tools re-shape it: displayValue as the value, score 0-100.
 * The score is nullish rather than nullable because a metric Lighthouse did not produce
 * (INP on a cold lab load, for example) is still reported with an undefined score.
 */
const metric = z.object({
  title: z.string(),
  value: z.string(),
  score: z.number().nullish(),
});

/** A single audit entry as the audit tools expose it. */
const auditEntry = z.object({
  title: z.string(),
  score: z.number().nullable(),
  description: z.string().optional(),
  displayValue: z.string(),
});

/** Shared response envelope produced by createStructured* in the tool modules. */
const envelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    summary: z.string(),
    data,
    recommendations: z.array(z.string()).optional(),
  });

export const runAuditOutput = envelope(
  z.object({
    categories: z.record(z.string(), z.object({ title: z.string(), score: z.number() })),
    metrics: z.record(z.string(), metric),
    version: z.string(),
    fetchTime: z.string(),
  }),
);

const categoryScoreOutput = (scoreKey: "accessibilityScore" | "seoScore") =>
  envelope(
    z.object({
      [scoreKey]: z.number(),
      fetchTime: z.string(),
      includeDetails: z.boolean(),
      audits: z.array(auditEntry).optional(),
    }),
  );

export const accessibilityScoreOutput = categoryScoreOutput("accessibilityScore");
export const seoAnalysisOutput = categoryScoreOutput("seoScore");

export const performanceScoreOutput = envelope(
  z.object({
    performanceScore: z.number(),
    metrics: z.record(z.string(), metric),
    fetchTime: z.string(),
  }),
);

export const coreWebVitalsOutput = envelope(
  z.object({
    coreWebVitals: z.record(z.string(), metric),
    thresholdResults: z.record(z.string(), z.boolean().nullable()),
    fetchTime: z.string(),
    includeDetails: z.boolean().optional(),
  }),
);

export const compareDevicesOutput = envelope(
  z.object({
    differences: z.record(
      z.string(),
      z.object({
        mobile: z.number(),
        desktop: z.number(),
        difference: z.number(),
        better: z.enum(["mobile", "desktop"]),
      }),
    ),
    includeDetails: z.boolean().optional(),
  }),
);

export const performanceBudgetOutput = envelope(
  z.object({
    overallPassed: z.boolean(),
    results: z.record(
      z.string(),
      z.object({
        actual: z.number(),
        budget: z.number(),
        unit: z.string(),
        passed: z.boolean(),
        difference: z.number().nullable(),
      }),
    ),
    fetchTime: z.string(),
  }),
);

export const lcpOpportunitiesOutput = envelope(
  z.object({
    lcpValue: z.number(),
    threshold: z.number(),
    needsImprovement: z.boolean(),
    opportunities: z.array(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
        score: z.number().nullable().optional(),
        displayValue: z.string().optional(),
        numericValue: z.number().optional(),
      }),
    ),
    fetchTime: z.string(),
    includeDetails: z.boolean().optional(),
  }),
);

export const securityAuditOutput = envelope(
  z.object({
    overallScore: z.number(),
    audits: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        description: z.string(),
        score: z.number().nullable(),
        displayValue: z.string(),
        status: z.enum(["pass", "fail", "warning"]),
      }),
    ),
    auditCount: z.number(),
    passedAudits: z.number(),
    failedAudits: z.number(),
    fetchTime: z.string(),
  }),
);

// The analysis tools return their payload directly rather than through the envelope.
export const unusedJavaScriptOutput = z.object({
  url: z.string(),
  device: z.string(),
  timestamp: z.string(),
  thresholdBytes: z.number().optional(),
  summary: z.object({
    totalUnusedKB: z.number(),
    totalFilesAnalyzed: z.number(),
    hasUnusedCode: z.boolean(),
  }),
  unusedFiles: z.array(
    z.object({
      filename: z.string(),
      totalKB: z.number(),
      unusedKB: z.number(),
      unusedPercent: z.number(),
      url: z.string(),
    }),
  ),
  recommendations: z.array(z.string()),
});

export const resourceAnalysisOutput = z.object({
  url: z.string(),
  device: z.string(),
  timestamp: z.string(),
  filters: z.object({
    resourceTypes: z.array(z.string()),
    minSizeKB: z.number(),
  }),
  summary: z.object({
    totalResources: z.number(),
    totalSizeKB: z.number(),
    resourceCounts: z.record(z.string(), z.object({ count: z.number(), sizeKB: z.number() })),
  }),
  resources: z.array(
    z.object({
      filename: z.string(),
      type: z.string(),
      sizeKB: z.number(),
      mimeType: z.string(),
      url: z.string(),
    }),
  ),
  optimization: z.object({
    recommendations: z.array(z.string()),
    priorities: z.array(z.string()),
  }),
});
