import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export type ToolHandler = (args: Record<string, never>) => Promise<{
  content: { type: string; text: string }[];
  isError?: boolean;
}>;

export interface RegisteredTool {
  config: { title?: string; description?: string; annotations?: Record<string, boolean> };
  handler: ToolHandler;
}

/**
 * Registers a tool module against a stub server and hands back the captured handlers, so
 * tests can invoke the tool bodies directly instead of only asserting registration.
 */
export function collectTools(register: (server: McpServer) => void): Map<string, RegisteredTool> {
  const tools = new Map<string, RegisteredTool>();
  const server = {
    registerTool: (name: string, config: RegisteredTool["config"], handler: ToolHandler) => {
      tools.set(name, { config, handler });
    },
  };

  register(server as unknown as McpServer);
  return tools;
}

/** Invokes a captured handler and parses the JSON body it embeds in its text content. */
export async function callTool(tools: Map<string, RegisteredTool>, name: string, args: Record<string, unknown>) {
  const tool = tools.get(name);
  if (!tool) throw new Error(`tool ${name} was never registered`);

  const result = await tool.handler(args as Record<string, never>);
  // Analysis tools put a human-readable summary first and the JSON payload second.
  const jsonPart = result.content.at(-1)?.text ?? "";

  return { isError: result.isError === true, payload: JSON.parse(jsonPart), content: result.content };
}
