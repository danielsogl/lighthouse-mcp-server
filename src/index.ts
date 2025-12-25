#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  registerAuditTools,
  registerPerformanceTools,
  registerAnalysisTools,
  registerSecurityTools,
} from "./tools/index";
import { registerPrompts } from "./prompts";
import { registerResources } from "./resources";
import { readFileSync } from "fs";
import { join } from "path";
import { parseCliArgs } from "./cli";
import { setChromeLaunchConfig } from "./chrome-config";

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
