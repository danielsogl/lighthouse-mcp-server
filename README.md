# Lighthouse MCP Server

[![NPM Version](https://img.shields.io/npm/v/@danielsogl/lighthouse-mcp?style=flat-square)](https://www.npmjs.com/package/@danielsogl/lighthouse-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](./LICENSE)
[![Node Version](https://img.shields.io/node/v/@danielsogl/lighthouse-mcp?style=flat-square)](https://nodejs.org)
[![CI](https://img.shields.io/github/actions/workflow/status/danielsogl/lighthouse-mcp-server/ci.yml?branch=main&style=flat-square)](https://github.com/danielsogl/lighthouse-mcp-server/actions)
[![Coverage](https://img.shields.io/codecov/c/github/danielsogl/lighthouse-mcp-server?style=flat-square)](https://codecov.io/gh/danielsogl/lighthouse-mcp-server)
[![Sponsor](https://img.shields.io/badge/💖_Sponsor-danielsogl-EA4AAA?style=flat-square)](https://github.com/sponsors/danielsogl)

A Model Context Protocol (MCP) server that provides comprehensive web performance auditing and analysis capabilities using Google Lighthouse. This server enables LLMs and AI agents to perform detailed website performance assessments, accessibility audits, SEO analysis, security checks, and Core Web Vitals monitoring.

## 🌟 Key Features

- **🚀 Performance Analysis**: Complete Lighthouse audits with Core Web Vitals, performance scores, and optimization recommendations
- **♿ Accessibility Audits**: WCAG compliance checking and accessibility score analysis
- **🔍 SEO Analysis**: Search engine optimization audits and best practice recommendations
- **🔒 Security Assessment**: HTTPS, CSP, and security vulnerability scanning
- **📊 Resource Analysis**: JavaScript, CSS, image, and font optimization opportunities
- **📱 Mobile vs Desktop**: Comparative analysis across devices with throttling options
- **⚡ Core Web Vitals**: LCP, FID, CLS monitoring with threshold checking
- **🎯 Performance Budgets**: Custom performance thresholds and budget monitoring

## 🛠️ Requirements

- Node.js 22.0.0 or newer
- Chrome/Chromium browser (automatically managed by Lighthouse)
- VS Code, Cursor, Windsurf, Claude Desktop, or any other MCP client

## 🚀 Getting Started

Install the Lighthouse MCP server with your preferred client using one of the configurations below:

```json
{
  "mcpServers": {
    "lighthouse": {
      "command": "npx",
      "args": ["@danielsogl/lighthouse-mcp@latest"]
    }
  }
}
```

### Install in VS Code

[<img src="https://img.shields.io/badge/VS_Code-Install_Server-0078d4?style=for-the-badge&logo=visual-studio-code" alt="Install in VS Code">](https://code.visualstudio.com/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522lighthouse%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522%2540danielsogl%252Flighthouse-mcp%2540latest%2522%255D%257D)

[<img src="https://img.shields.io/badge/VS_Code_Insiders-Install_Server-1f8b34?style=for-the-badge&logo=visual-studio-code" alt="Install in VS Code Insiders">](https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522lighthouse%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522%2540danielsogl%252Flighthouse-mcp%2540latest%2522%255D%257D)

<details>
<summary><b>Manual VS Code Installation</b></summary>

You can also install the Lighthouse MCP server using the VS Code CLI:

```bash
# For VS Code
code --add-mcp '{"name":"lighthouse","command":"npx","args":["@danielsogl/lighthouse-mcp@latest"]}'

# For VS Code Insiders
code-insiders --add-mcp '{"name":"lighthouse","command":"npx","args":["@danielsogl/lighthouse-mcp@latest"]}'
```

After installation, the Lighthouse MCP server will be available for use with your GitHub Copilot agent in VS Code.

</details>

### Install in Cursor

[<img src="https://img.shields.io/badge/Cursor-Install_Server-1a1a1a?style=for-the-badge&logo=cursor" alt="Install in Cursor">](cursor://mcp/install?name=lighthouse&command=npx&args=@danielsogl/lighthouse-mcp@latest)

<details>
<summary><b>Manual Cursor Installation</b></summary>

Go to `Cursor Settings` → `MCP` → `Add new MCP Server`. Name it "lighthouse", use `command` type with the command `npx @danielsogl/lighthouse-mcp@latest`:

```json
{
  "mcpServers": {
    "lighthouse": {
      "command": "npx",
      "args": ["@danielsogl/lighthouse-mcp@latest"]
    }
  }
}
```

</details>

### Install in Windsurf

[<img src="https://img.shields.io/badge/Windsurf-Install_Server-00d4aa?style=for-the-badge" alt="Install in Windsurf">](windsurf://mcp/install?name=lighthouse&command=npx&args=@danielsogl/lighthouse-mcp@latest)

<details>
<summary><b>Manual Windsurf Installation</b></summary>

Follow the Windsurf MCP [documentation](https://docs.windsurf.com/windsurf/cascade/mcp). Use the following configuration:

```json
{
  "mcpServers": {
    "lighthouse": {
      "command": "npx",
      "args": ["@danielsogl/lighthouse-mcp@latest"]
    }
  }
}
```

</details>

### Install in Claude Desktop

<details>
<summary><b>Claude Desktop Installation</b></summary>

Follow the MCP install [guide](https://modelcontextprotocol.io/quickstart/user), use the following configuration:

```json
{
  "mcpServers": {
    "lighthouse": {
      "command": "npx",
      "args": ["@danielsogl/lighthouse-mcp@latest"]
    }
  }
}
```

</details>

## 🔧 Available Tools

The Lighthouse MCP server provides the following tools for comprehensive web analysis:

### 🏁 Audit Tools

| Tool                      | Description                                 | Parameters                                     |
| ------------------------- | ------------------------------------------- | ---------------------------------------------- |
| `run_audit`               | Run a comprehensive Lighthouse audit        | `url`, `categories?`, `device?`, `throttling?` |
| `get_accessibility_score` | Get accessibility score and recommendations | `url`, `device?`, `includeDetails?`            |
| `get_seo_analysis`        | Get SEO analysis and recommendations        | `url`, `device?`, `includeDetails?`            |
| `check_pwa_readiness`     | Check Progressive Web App readiness         | `url`, `device?`, `includeDetails?`            |

### ⚡ Performance Tools

| Tool                       | Description                         | Parameters                                             |
| -------------------------- | ----------------------------------- | ------------------------------------------------------ |
| `get_performance_score`    | Get overall performance score       | `url`, `device?`                                       |
| `get_core_web_vitals`      | Get Core Web Vitals metrics         | `url`, `device?`, `includeDetails?`, `threshold?`      |
| `compare_mobile_desktop`   | Compare performance across devices  | `url`, `categories?`, `throttling?`, `includeDetails?` |
| `check_performance_budget` | Check against performance budgets   | `url`, `device?`, `budget`                             |
| `get_lcp_opportunities`    | Find LCP optimization opportunities | `url`, `device?`, `includeDetails?`, `threshold?`      |

### 🔍 Analysis Tools

| Tool                     | Description                   | Parameters                                          |
| ------------------------ | ----------------------------- | --------------------------------------------------- |
| `find_unused_javascript` | Find unused JavaScript code   | `url`, `device?`, `minBytes?`, `includeSourceMaps?` |
| `analyze_resources`      | Analyze all website resources | `url`, `device?`, `resourceTypes?`, `minSize?`      |

### 🔒 Security Tools

| Tool                 | Description                          | Parameters                  |
| -------------------- | ------------------------------------ | --------------------------- |
| `get_security_audit` | Perform comprehensive security audit | `url`, `device?`, `checks?` |

## 📋 Parameter Details

### Common Parameters

- **`url`** (required): The website URL to analyze
- **`device`**: Target device (`"desktop"` or `"mobile"`, default: `"desktop"`)
- **`includeDetails`**: Include detailed audit information (default: `false`)
- **`throttling`**: Enable network/CPU throttling (default: `false`)

### Specific Parameters

- **`categories`**: Lighthouse categories to audit (`["performance", "accessibility", "best-practices", "seo", "pwa"]`)
- **`threshold`**: Custom thresholds for metrics (e.g., `{"lcp": 2.5, "fid": 100, "cls": 0.1}`)
- **`budget`**: Performance budget limits (e.g., `{"performanceScore": 90, "largestContentfulPaint": 2500}`)
- **`resourceTypes`**: Resource types to analyze (`["images", "javascript", "css", "fonts", "other"]`)
- **`minBytes`**: Minimum file size threshold for analysis (default: `2048`)
- **`checks`**: Security checks to perform (`["https", "mixed-content", "csp", "hsts", "vulnerabilities"]`)

## 💡 Usage Examples

### Basic Performance Audit

```javascript
// Get overall performance score
{
  "tool": "get_performance_score",
  "arguments": {
    "url": "https://example.com",
    "device": "mobile"
  }
}
```

### Core Web Vitals Analysis

```javascript
// Check Core Web Vitals with custom thresholds
{
  "tool": "get_core_web_vitals",
  "arguments": {
    "url": "https://example.com",
    "device": "mobile",
    "includeDetails": true,
    "threshold": {
      "lcp": 2.5,
      "fid": 100,
      "cls": 0.1
    }
  }
}
```

### Security Assessment

```javascript
// Comprehensive security audit
{
  "tool": "get_security_audit",
  "arguments": {
    "url": "https://example.com",
    "checks": ["https", "csp", "hsts"]
  }
}
```

### Resource Optimization

```javascript
// Find optimization opportunities
{
  "tool": "analyze_resources",
  "arguments": {
    "url": "https://example.com",
    "resourceTypes": ["images", "javascript"],
    "minSize": 1024
  }
}
```

## 🎯 Use Cases

- **Performance Monitoring**: Automated performance tracking and Core Web Vitals monitoring
- **Accessibility Compliance**: WCAG 2.1 compliance checking and remediation guidance
- **SEO Optimization**: Technical SEO audits and search engine optimization recommendations
- **Security Assessment**: Vulnerability scanning and security best practice validation
- **Resource Optimization**: Bundle analysis and optimization opportunity identification
- **Performance Budgets**: Automated performance budget monitoring and alerting
- **CI/CD Integration**: Automated quality gates and performance regression detection

## 🏗️ Architecture

The server is built using:

- **[Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)**: For MCP server implementation
- **[Google Lighthouse](https://github.com/GoogleChrome/lighthouse)**: For web performance auditing
- **[Chrome Launcher](https://github.com/GoogleChrome/chrome-launcher)**: For browser automation
- **TypeScript**: For type safety and better developer experience
- **Zod**: For runtime schema validation

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Code style and standards
- Testing requirements
- Pull request process
- Development setup

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🔒 Security

For security issues, please see our [Security Policy](./SECURITY.md).

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/danielsogl/lighthouse-mcp-server/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/danielsogl/lighthouse-mcp-server/discussions)
- 📧 **Email**: security@codingrules.ai

## 🙏 Acknowledgments

- Google Lighthouse team for the excellent auditing engine
- Anthropic for the Model Context Protocol specification
- The open source community for continuous inspiration and contributions

---

Built with ❤️ by [Daniel Sogl](https://github.com/danielsogl)
