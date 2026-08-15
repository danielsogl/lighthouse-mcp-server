import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodType } from "zod";

export type ToolHandler = (args: Record<string, never>) => Promise<{
  content: { type: string; text: string }[];
  structuredContent?: unknown;
  isError?: boolean;
}>;

export interface RegisteredTool {
  config: {
    title?: string;
    description?: string;
    annotations?: Record<string, boolean>;
    outputSchema?: ZodType;
  };
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

/**
 * Invokes a captured handler and parses the JSON body it embeds in its text content.
 *
 * Calling the handler directly bypasses the SDK, so this reproduces the SDK's own output
 * validation: a successful result must carry structuredContent matching the declared
 * outputSchema. That keeps every tool's schema honest from the unit tests, not just the
 * handful the e2e suite happens to exercise.
 */
export async function callTool(tools: Map<string, RegisteredTool>, name: string, args: Record<string, unknown>) {
  const tool = tools.get(name);
  if (!tool) throw new Error(`tool ${name} was never registered`);

  const result = await tool.handler(args as Record<string, never>);
  // Analysis tools put a human-readable summary first and the JSON payload second.
  const jsonPart = result.content.at(-1)?.text ?? "";

  if (tool.config.outputSchema && !result.isError) {
    if (result.structuredContent === undefined) {
      throw new Error(`tool ${name} declares an outputSchema but returned no structuredContent`);
    }
    const parsed = tool.config.outputSchema.safeParse(result.structuredContent);
    if (!parsed.success) {
      throw new Error(`tool ${name} structuredContent does not match its outputSchema: ${parsed.error.message}`);
    }
  }

  return {
    isError: result.isError === true,
    payload: JSON.parse(jsonPart),
    structuredContent: result.structuredContent,
    content: result.content,
  };
}
