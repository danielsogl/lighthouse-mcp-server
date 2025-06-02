import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer) {
  // Analyze audit results prompt
  server.prompt(
    "analyze-audit-results",
    {
      auditResults: z.string().describe("JSON audit results from Lighthouse"),
      focusArea: z
        .enum(["performance", "accessibility", "seo", "best-practices", "pwa"])
        .optional()
        .describe("Specific area to focus the analysis on"),
    },
    ({ auditResults, focusArea }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please analyze these Lighthouse audit results and provide actionable insights${focusArea ? ` focusing on ${focusArea}` : ""}:

${auditResults}

Please provide:
1. Key performance issues identified
2. Prioritized recommendations for improvement
3. Estimated impact of each recommendation
4. Implementation difficulty level for each recommendation`,
          },
        },
      ],
    }),
  );

  // Generate performance improvement plan
  server.prompt(
    "create-performance-plan",
    {
      currentMetrics: z.string().describe("Current performance metrics from Lighthouse"),
      targetGoals: z.string().optional().describe("Specific performance goals or targets"),
      timeframe: z.string().optional().describe("Timeline for implementing improvements"),
    },
    ({ currentMetrics, targetGoals, timeframe }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Based on these current performance metrics, create a comprehensive improvement plan:

Current Metrics:
${currentMetrics}

${targetGoals ? `Target Goals: ${targetGoals}` : ""}
${timeframe ? `Timeframe: ${timeframe}` : ""}

Please provide:
1. A step-by-step action plan
2. Technical implementation details for each step
3. Expected performance improvements
4. Testing and validation strategies
5. Monitoring recommendations`,
          },
        },
      ],
    }),
  );

  // Compare audit results
  server.prompt(
    "compare-audits",
    {
      beforeAudit: z.string().describe("Lighthouse audit results before changes"),
      afterAudit: z.string().describe("Lighthouse audit results after changes"),
      changesImplemented: z.string().optional().describe("Description of changes that were implemented"),
    },
    ({ beforeAudit, afterAudit, changesImplemented }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Compare these before and after Lighthouse audit results:

BEFORE:
${beforeAudit}

AFTER:
${afterAudit}

${changesImplemented ? `Changes Implemented: ${changesImplemented}` : ""}

Please provide:
1. Summary of improvements and regressions
2. Impact analysis of the changes
3. Recommendations for further optimization
4. Any concerning trends or issues that emerged`,
          },
        },
      ],
    }),
  );

  // Generate SEO recommendations
  server.prompt(
    "seo-recommendations",
    {
      seoAudit: z.string().describe("SEO audit results from Lighthouse"),
      websiteType: z.string().optional().describe("Type of website (e.g., e-commerce, blog, corporate)"),
      targetAudience: z.string().optional().describe("Target audience or market"),
    },
    ({ seoAudit, websiteType, targetAudience }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Based on these SEO audit results, provide comprehensive SEO recommendations:

${seoAudit}

${websiteType ? `Website Type: ${websiteType}` : ""}
${targetAudience ? `Target Audience: ${targetAudience}` : ""}

Please provide:
1. Critical SEO issues that need immediate attention
2. On-page optimization recommendations
3. Technical SEO improvements
4. Content strategy suggestions
5. Implementation priority and effort estimates`,
          },
        },
      ],
    }),
  );

  // Accessibility improvement guide
  server.prompt(
    "accessibility-guide",
    {
      accessibilityAudit: z.string().describe("Accessibility audit results from Lighthouse"),
      complianceLevel: z.enum(["AA", "AAA"]).optional().describe("WCAG compliance level to target"),
      userGroups: z
        .string()
        .optional()
        .describe("Specific user groups to consider (e.g., visually impaired, motor disabilities)"),
    },
    ({ accessibilityAudit, complianceLevel, userGroups }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Based on these accessibility audit results, create an accessibility improvement guide:

${accessibilityAudit}

${complianceLevel ? `Target WCAG Level: ${complianceLevel}` : "Target WCAG Level: AA"}
${userGroups ? `Focus on user groups: ${userGroups}` : ""}

Please provide:
1. Critical accessibility barriers to address first
2. Step-by-step remediation instructions
3. Testing strategies for each improvement
4. Code examples and best practices
5. Long-term accessibility maintenance plan`,
          },
        },
      ],
    }),
  );

  // Performance budget recommendations
  server.prompt(
    "create-performance-budget",
    {
      currentMetrics: z.string().describe("Current performance metrics"),
      businessGoals: z.string().optional().describe("Business goals and requirements"),
      userBase: z.string().optional().describe("Information about the user base and their typical devices/connections"),
    },
    ({ currentMetrics, businessGoals, userBase }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Help create a performance budget based on these current metrics:

${currentMetrics}

${businessGoals ? `Business Goals: ${businessGoals}` : ""}
${userBase ? `User Base: ${userBase}` : ""}

Please provide:
1. Recommended performance budget values for key metrics
2. Justification for each budget threshold
3. Implementation strategy for budget monitoring
4. Alert and escalation procedures
5. Regular review and adjustment recommendations`,
          },
        },
      ],
    }),
  );

  // Core Web Vitals optimization
  server.prompt(
    "optimize-core-web-vitals",
    {
      coreWebVitals: z.string().describe("Core Web Vitals metrics and detailed breakdown"),
      framework: z.string().optional().describe("Frontend framework or technology stack"),
      constraints: z.string().optional().describe("Any technical or business constraints"),
    },
    ({ coreWebVitals, framework, constraints }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Help optimize Core Web Vitals based on these metrics:

${coreWebVitals}

${framework ? `Technology Stack: ${framework}` : ""}
${constraints ? `Constraints: ${constraints}` : ""}

Please provide:
1. Specific optimizations for LCP (Largest Contentful Paint)
2. Specific optimizations for FID/INP (First Input Delay/Interaction to Next Paint)
3. Specific optimizations for CLS (Cumulative Layout Shift)
4. Framework-specific recommendations
5. Measurement and monitoring strategy`,
          },
        },
      ],
    }),
  );

  // Resource optimization recommendations
  server.prompt(
    "optimize-resources",
    {
      resourceAnalysis: z.string().describe("Resource analysis results from Lighthouse"),
      loadingStrategy: z.string().optional().describe("Current loading strategy (e.g., SPA, SSR, SSG)"),
      criticalUserJourneys: z.string().optional().describe("Critical user journeys that need optimal performance"),
    },
    ({ resourceAnalysis, loadingStrategy, criticalUserJourneys }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Based on this resource analysis, provide optimization recommendations:

${resourceAnalysis}

${loadingStrategy ? `Current Loading Strategy: ${loadingStrategy}` : ""}
${criticalUserJourneys ? `Critical User Journeys: ${criticalUserJourneys}` : ""}

Please provide:
1. Resource bundling and splitting strategies
2. Image optimization recommendations
3. JavaScript and CSS optimization techniques
4. Caching and CDN strategies
5. Progressive loading implementation`,
          },
        },
      ],
    }),
  );
}
