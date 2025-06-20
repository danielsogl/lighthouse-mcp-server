// Types for Lighthouse results
export interface LighthouseCategory {
  title: string;
  score: number;
  description: string;
  auditRefs?: Array<{ id: string; weight?: number; group?: string }>;
}

export interface LighthouseAudit {
  title: string;
  description?: string;
  numericValue?: number;
  displayValue?: string;
  score: number | null;
  scoreDisplayMode?: string;
  details?: {
    items?: Record<string, unknown>[];
    [key: string]: unknown;
  };
}

export interface LighthouseResult {
  lhr: {
    finalDisplayedUrl: string;
    fetchTime: string;
    lighthouseVersion: string;
    userAgent: string;
    categories: Record<string, LighthouseCategory>;
    audits: Record<string, LighthouseAudit>;
  };
}

export interface LighthouseAuditResult {
  url: string;
  fetchTime: string;
  version: string;
  userAgent: string;
  device: string;
  categories: Record<
    string,
    {
      title: string;
      score: number;
      description: string;
    }
  >;
  metrics: Record<
    string,
    {
      title: string;
      value: number;
      displayValue: string;
      score: number | null;
    }
  >;
}
