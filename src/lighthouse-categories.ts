import { runLighthouseAudit, getDetailedAuditResults } from "./lighthouse-core";

// Helper function to get accessibility score and details
export async function getAccessibilityScore(
  url: string,
  device: "desktop" | "mobile" = "desktop",
  includeDetails = false,
) {
  const result = await runLighthouseAudit(url, ["accessibility"], device);
  const categoryData = result.categories.accessibility;

  const baseData = {
    url: result.url,
    device: result.device,
    accessibilityScore: categoryData?.score || 0,
    fetchTime: result.fetchTime,
  };

  if (includeDetails) {
    const { audits } = await getDetailedAuditResults(url, "accessibility", device);
    return { ...baseData, audits };
  }

  return baseData;
}

// Helper function to get SEO analysis
export async function getSeoAnalysis(url: string, device: "desktop" | "mobile" = "desktop", includeDetails = false) {
  const result = await runLighthouseAudit(url, ["seo"], device);
  const categoryData = result.categories.seo;

  const baseData = {
    url: result.url,
    device: result.device,
    seoScore: categoryData?.score || 0,
    fetchTime: result.fetchTime,
  };

  if (includeDetails) {
    const { audits } = await getDetailedAuditResults(url, "seo", device);
    return { ...baseData, audits };
  }

  return baseData;
}

// Helper function to check PWA readiness
export async function checkPwaReadiness(url: string, device: "desktop" | "mobile" = "desktop", includeDetails = false) {
  const result = await runLighthouseAudit(url, ["pwa"], device);
  const categoryData = result.categories.pwa;

  const baseData = {
    url: result.url,
    device: result.device,
    pwaScore: categoryData?.score || 0,
    fetchTime: result.fetchTime,
  };

  if (includeDetails) {
    const { audits } = await getDetailedAuditResults(url, "pwa", device);
    return { ...baseData, audits };
  }

  return baseData;
}
