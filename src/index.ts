#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  registerAuditTools,
  registerPerformanceTools,
  registerAnalysisTools,
  registerSecurityTools,
} from "./tools/index.js";
import { registerPrompts } from "./prompts.js";
import { registerResources } from "./resources.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { parseCliArgs } from "./cli.js";
import { setChromeLaunchConfig } from "./chrome-config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));

const cliConfig = parseCliArgs(process.argv.slice(2));
setChromeLaunchConfig(cliConfig);

const server = new McpServer({
  name: "Lighthouse",
  version: packageJson.version,
});

// Register all tool categories
registerAuditTools(server);
registerPerformanceTools(server);
registerAnalysisTools(server);
registerSecurityTools(server);

// Register prompts
registerPrompts(server);

// Register resources
registerResources(server);

// Start receiving messages on stdin and sending messages on stdout
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// eslint-disable-next-line no-console
main().catch(console.error);
