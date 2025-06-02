import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register useful resources for the Lighthouse MCP server
 * Resources provide read-only reference data that can be useful for analysis
 */
export function registerResources(server: McpServer) {
  // Performance thresholds and guidelines
  server.resource("core-web-vitals-thresholds", "lighthouse://performance/core-web-vitals-thresholds", async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            lcp: {
              good: { max: 2.5, unit: "seconds" },
              needsImprovement: { min: 2.5, max: 4.0, unit: "seconds" },
              poor: { min: 4.0, unit: "seconds" },
            },
            fid: {
              good: { max: 100, unit: "milliseconds" },
              needsImprovement: { min: 100, max: 300, unit: "milliseconds" },
              poor: { min: 300, unit: "milliseconds" },
            },
            cls: {
              good: { max: 0.1, unit: "score" },
              needsImprovement: { min: 0.1, max: 0.25, unit: "score" },
              poor: { min: 0.25, unit: "score" },
            },
            fcp: {
              good: { max: 1.8, unit: "seconds" },
              needsImprovement: { min: 1.8, max: 3.0, unit: "seconds" },
              poor: { min: 3.0, unit: "seconds" },
            },
            tbt: {
              good: { max: 200, unit: "milliseconds" },
              needsImprovement: { min: 200, max: 600, unit: "milliseconds" },
              poor: { min: 600, unit: "milliseconds" },
            },
            speedIndex: {
              good: { max: 3.4, unit: "seconds" },
              needsImprovement: { min: 3.4, max: 5.8, unit: "seconds" },
              poor: { min: 5.8, unit: "seconds" },
            },
          },
          null,
          2,
        ),
      },
    ],
  }));

  // Performance optimization techniques
  server.resource("optimization-techniques", "lighthouse://performance/optimization-techniques", async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            images: {
              techniques: [
                {
                  name: "Use modern image formats (WebP, AVIF)",
                  impact: "high",
                  savings: "25-50% file size reduction",
                  difficulty: "medium",
                },
                {
                  name: "Implement lazy loading",
                  impact: "high",
                  savings: "Faster initial page load",
                  difficulty: "easy",
                },
                {
                  name: "Optimize image dimensions",
                  impact: "medium",
                  savings: "10-30% file size reduction",
                  difficulty: "easy",
                },
                {
                  name: "Use responsive images with srcset",
                  impact: "medium",
                  savings: "Improved mobile performance",
                  difficulty: "medium",
                },
              ],
            },
            javascript: {
              techniques: [
                {
                  name: "Code splitting and lazy loading",
                  impact: "high",
                  savings: "Reduced initial bundle size",
                  difficulty: "medium",
                },
                {
                  name: "Tree shaking unused code",
                  impact: "medium",
                  savings: "10-40% bundle size reduction",
                  difficulty: "easy",
                },
                {
                  name: "Minification and compression",
                  impact: "medium",
                  savings: "20-30% file size reduction",
                  difficulty: "easy",
                },
                {
                  name: "Use modern bundling tools",
                  impact: "medium",
                  savings: "Better optimization",
                  difficulty: "medium",
                },
              ],
            },
            css: {
              techniques: [
                {
                  name: "Remove unused CSS",
                  impact: "medium",
                  savings: "20-50% file size reduction",
                  difficulty: "medium",
                },
                {
                  name: "Critical CSS inlining",
                  impact: "high",
                  savings: "Faster first paint",
                  difficulty: "hard",
                },
                {
                  name: "CSS minification",
                  impact: "low",
                  savings: "10-20% file size reduction",
                  difficulty: "easy",
                },
              ],
            },
            caching: {
              techniques: [
                {
                  name: "Implement proper cache headers",
                  impact: "high",
                  savings: "Eliminated repeat downloads",
                  difficulty: "medium",
                },
                {
                  name: "Use CDN for static assets",
                  impact: "high",
                  savings: "Reduced latency",
                  difficulty: "medium",
                },
                {
                  name: "Service worker caching",
                  impact: "high",
                  savings: "Offline capability",
                  difficulty: "hard",
                },
              ],
            },
          },
          null,
          2,
        ),
      },
    ],
  }));

  // Accessibility guidelines and WCAG compliance
  server.resource("wcag-guidelines", "lighthouse://accessibility/wcag-guidelines", async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            principles: {
              perceivable: {
                description: "Information must be presentable in ways users can perceive",
                guidelines: [
                  "Provide text alternatives for images",
                  "Provide captions for videos",
                  "Ensure sufficient color contrast",
                  "Make content adaptable to different presentations",
                ],
              },
              operable: {
                description: "Interface components must be operable",
                guidelines: [
                  "Make all functionality keyboard accessible",
                  "Give users enough time to read content",
                  "Don't use content that causes seizures",
                  "Help users navigate and find content",
                ],
              },
              understandable: {
                description: "Information and UI operation must be understandable",
                guidelines: [
                  "Make text readable and understandable",
                  "Make content appear and operate predictably",
                  "Help users avoid and correct mistakes",
                ],
              },
              robust: {
                description: "Content must be robust enough for interpretation by assistive technologies",
                guidelines: [
                  "Maximize compatibility with assistive technologies",
                  "Use valid, semantic HTML",
                  "Ensure content works across different browsers",
                ],
              },
            },
            commonIssues: [
              {
                issue: "Missing alt text on images",
                severity: "high",
                impact: "Screen readers cannot describe images",
                solution: "Add descriptive alt attributes to all images",
              },
              {
                issue: "Insufficient color contrast",
                severity: "medium",
                impact: "Text may be hard to read for users with vision impairments",
                solution: "Ensure contrast ratio of at least 4.5:1 for normal text",
              },
              {
                issue: "Missing form labels",
                severity: "high",
                impact: "Users cannot understand form inputs",
                solution: "Associate labels with form controls using for/id attributes",
              },
              {
                issue: "No keyboard navigation",
                severity: "high",
                impact: "Users cannot navigate without a mouse",
                solution: "Ensure all interactive elements are keyboard accessible",
              },
            ],
          },
          null,
          2,
        ),
      },
    ],
  }));

  // SEO best practices and guidelines
  server.resource("seo-best-practices", "lighthouse://seo/best-practices", async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            technical: {
              meta: [
                {
                  element: "title",
                  requirement: "50-60 characters",
                  importance: "critical",
                  description: "Primary heading displayed in search results",
                },
                {
                  element: "meta description",
                  requirement: "150-160 characters",
                  importance: "high",
                  description: "Summary displayed in search results",
                },
                {
                  element: "meta viewport",
                  requirement: "Must be present",
                  importance: "critical",
                  description: "Required for mobile-friendly pages",
                },
              ],
              structure: [
                {
                  element: "heading hierarchy",
                  requirement: "Logical H1-H6 structure",
                  importance: "medium",
                  description: "Helps search engines understand content structure",
                },
                {
                  element: "semantic HTML",
                  requirement: "Use appropriate HTML5 elements",
                  importance: "medium",
                  description: "Improves content understanding",
                },
              ],
              performance: [
                {
                  factor: "page speed",
                  impact: "high",
                  description: "Fast-loading pages rank higher",
                },
                {
                  factor: "mobile-friendliness",
                  impact: "critical",
                  description: "Mobile-first indexing is standard",
                },
                {
                  factor: "HTTPS",
                  impact: "medium",
                  description: "Security is a ranking factor",
                },
              ],
            },
            content: {
              optimization: [
                {
                  technique: "Keyword optimization",
                  description: "Use relevant keywords naturally in content",
                  avoid: "Keyword stuffing or over-optimization",
                },
                {
                  technique: "Internal linking",
                  description: "Link to related content within your site",
                  benefit: "Helps search engines discover and understand content",
                },
                {
                  technique: "Schema markup",
                  description: "Add structured data to help search engines understand content",
                  benefit: "Can lead to rich snippets in search results",
                },
              ],
            },
          },
          null,
          2,
        ),
      },
    ],
  }));

  // Security best practices and common vulnerabilities
  server.resource("security-best-practices", "lighthouse://security/best-practices", async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            https: {
              importance: "critical",
              description: "Encrypt all data in transit",
              implementation: [
                "Use TLS 1.2 or higher",
                "Implement HTTP Strict Transport Security (HSTS)",
                "Redirect all HTTP traffic to HTTPS",
                "Use secure cookies with Secure flag",
              ],
            },
            headers: {
              "Content-Security-Policy": {
                purpose: "Prevent XSS attacks",
                example: "default-src 'self'; script-src 'self' 'unsafe-inline'",
                importance: "high",
              },
              "X-Frame-Options": {
                purpose: "Prevent clickjacking",
                example: "DENY or SAMEORIGIN",
                importance: "medium",
              },
              "X-Content-Type-Options": {
                purpose: "Prevent MIME type sniffing",
                example: "nosniff",
                importance: "medium",
              },
              "Referrer-Policy": {
                purpose: "Control referrer information",
                example: "strict-origin-when-cross-origin",
                importance: "low",
              },
            },
            commonVulnerabilities: [
              {
                name: "Cross-Site Scripting (XSS)",
                prevention: "Sanitize user input, use CSP headers",
                severity: "high",
              },
              {
                name: "Cross-Site Request Forgery (CSRF)",
                prevention: "Use CSRF tokens, SameSite cookies",
                severity: "medium",
              },
              {
                name: "Insecure Dependencies",
                prevention: "Regular dependency updates, vulnerability scanning",
                severity: "variable",
              },
              {
                name: "Mixed Content",
                prevention: "Ensure all resources load over HTTPS",
                severity: "medium",
              },
            ],
          },
          null,
          2,
        ),
      },
    ],
  }));

  // Performance budgets and monitoring guidelines
  server.resource("budget-guidelines", "lighthouse://performance/budget-guidelines", async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            ecommerce: {
              description: "Online stores and retail websites",
              priorities: ["LCP", "CLS", "FID"],
              budgets: {
                lcp: { target: 2.0, warning: 2.5, critical: 4.0 },
                cls: { target: 0.05, warning: 0.1, critical: 0.25 },
                fid: { target: 50, warning: 100, critical: 300 },
                totalPageSize: { target: 1000, warning: 1500, critical: 2000, unit: "KB" },
                javascriptSize: { target: 300, warning: 500, critical: 800, unit: "KB" },
              },
            },
            content: {
              description: "Blogs, news sites, and content-heavy websites",
              priorities: ["LCP", "FCP", "Speed Index"],
              budgets: {
                lcp: { target: 2.5, warning: 3.0, critical: 4.0 },
                fcp: { target: 1.5, warning: 2.0, critical: 3.0 },
                speedIndex: { target: 3.0, warning: 4.0, critical: 5.8 },
                totalPageSize: { target: 800, warning: 1200, critical: 1800, unit: "KB" },
                imageSize: { target: 400, warning: 600, critical: 1000, unit: "KB" },
              },
            },
            application: {
              description: "Web applications and SaaS platforms",
              priorities: ["FID", "TBT", "CLS"],
              budgets: {
                fid: { target: 50, warning: 100, critical: 300 },
                tbt: { target: 150, warning: 300, critical: 600 },
                cls: { target: 0.05, warning: 0.1, critical: 0.25 },
                javascriptSize: { target: 500, warning: 800, critical: 1200, unit: "KB" },
                bundleCount: { target: 5, warning: 10, critical: 15 },
              },
            },
            mobile: {
              description: "Mobile-first or mobile-only experiences",
              priorities: ["LCP", "FID", "CLS"],
              budgets: {
                lcp: { target: 2.0, warning: 2.5, critical: 4.0 },
                fid: { target: 50, warning: 100, critical: 300 },
                cls: { target: 0.05, warning: 0.1, critical: 0.25 },
                totalPageSize: { target: 500, warning: 800, critical: 1200, unit: "KB" },
                imageSize: { target: 200, warning: 400, critical: 600, unit: "KB" },
              },
            },
          },
          null,
          2,
        ),
      },
    ],
  }));

  // Lighthouse audit categories and scoring
  server.resource("categories-scoring", "lighthouse://audits/categories-scoring", async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            categories: {
              performance: {
                description: "How fast your page loads and renders",
                weight: "Most important for user experience",
                keyMetrics: [
                  { name: "First Contentful Paint", weight: 10, description: "Time to first visual content" },
                  { name: "Largest Contentful Paint", weight: 25, description: "Time to largest visual element" },
                  { name: "First Input Delay", weight: 25, description: "Time to first user interaction" },
                  { name: "Cumulative Layout Shift", weight: 25, description: "Visual stability during loading" },
                  { name: "Total Blocking Time", weight: 10, description: "Time blocked from user interaction" },
                  { name: "Speed Index", weight: 5, description: "How quickly page contents are visually populated" },
                ],
              },
              accessibility: {
                description: "How accessible your page is to users with disabilities",
                weight: "Critical for inclusive design",
                keyAreas: [
                  "Color contrast and readability",
                  "Keyboard navigation support",
                  "Screen reader compatibility",
                  "Focus management",
                  "ARIA attributes and semantic HTML",
                ],
              },
              seo: {
                description: "How well your page can be discovered and crawled",
                weight: "Important for visibility",
                keyAreas: [
                  "Meta tags and structured data",
                  "Mobile-friendliness",
                  "Page load performance",
                  "Content structure and hierarchy",
                  "Crawlability and indexability",
                ],
              },
              bestPractices: {
                description: "General web development best practices",
                weight: "Foundation for good websites",
                keyAreas: [
                  "Security (HTTPS, CSP)",
                  "Modern web standards",
                  "Browser compatibility",
                  "Error handling",
                  "Development practices",
                ],
              },
              pwa: {
                description: "Progressive Web App capabilities",
                weight: "Enhanced user experience",
                keyAreas: [
                  "Service worker implementation",
                  "Offline functionality",
                  "App manifest",
                  "Installability",
                  "Mobile app-like experience",
                ],
              },
            },
            scoring: {
              methodology: "Lighthouse uses a weighted scoring system",
              ranges: {
                good: { min: 90, max: 100, color: "green" },
                needsImprovement: { min: 50, max: 89, color: "orange" },
                poor: { min: 0, max: 49, color: "red" },
              },
              interpretation: {
                "90-100": "Excellent - page follows best practices",
                "50-89": "Room for improvement - some issues to address",
                "0-49": "Poor - significant issues need attention",
              },
            },
          },
          null,
          2,
        ),
      },
    ],
  }));

  // Common web technologies and frameworks optimization
  server.resource("framework-guides", "lighthouse://frameworks/optimization-guides", async (uri) => ({
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(
          {
            react: {
              name: "React",
              optimizations: [
                {
                  technique: "Code splitting with React.lazy()",
                  impact: "Reduces initial bundle size",
                  implementation: "Use dynamic imports and Suspense",
                },
                {
                  technique: "Optimize re-renders with useMemo/useCallback",
                  impact: "Improves runtime performance",
                  implementation: "Memoize expensive calculations and callbacks",
                },
                {
                  technique: "Use React.memo for component optimization",
                  impact: "Prevents unnecessary re-renders",
                  implementation: "Wrap components that receive stable props",
                },
                {
                  technique: "Server-side rendering (Next.js)",
                  impact: "Faster initial page load",
                  implementation: "Use Next.js or similar SSR framework",
                },
              ],
            },
            vue: {
              name: "Vue.js",
              optimizations: [
                {
                  technique: "Async components and code splitting",
                  impact: "Reduces initial bundle size",
                  implementation: "Use dynamic imports in route definitions",
                },
                {
                  technique: "Vue 3 Composition API",
                  impact: "Better tree-shaking and performance",
                  implementation: "Migrate to Composition API where beneficial",
                },
                {
                  technique: "Nuxt.js for SSR/SSG",
                  impact: "Improved SEO and initial load",
                  implementation: "Use Nuxt.js for static site generation",
                },
              ],
            },
            angular: {
              name: "Angular",
              optimizations: [
                {
                  technique: "Lazy loading modules",
                  impact: "Smaller initial bundles",
                  implementation: "Use loadChildren in route configuration",
                },
                {
                  technique: "OnPush change detection",
                  impact: "Improved runtime performance",
                  implementation: "Use OnPush strategy where appropriate",
                },
                {
                  technique: "Angular Universal for SSR",
                  impact: "Better SEO and initial load",
                  implementation: "Implement server-side rendering",
                },
              ],
            },
            vanilla: {
              name: "Vanilla JavaScript",
              optimizations: [
                {
                  technique: "Modern ES modules",
                  impact: "Better tree-shaking",
                  implementation: "Use import/export syntax",
                },
                {
                  technique: "Web Components",
                  impact: "Reusable, encapsulated components",
                  implementation: "Use Custom Elements API",
                },
                {
                  technique: "Service Workers",
                  impact: "Offline functionality and caching",
                  implementation: "Implement caching strategies",
                },
              ],
            },
          },
          null,
          2,
        ),
      },
    ],
  }));
}
