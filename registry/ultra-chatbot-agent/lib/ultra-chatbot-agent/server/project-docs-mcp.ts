import { createMCPClient } from "@ai-sdk/mcp";
import type { ToolSet } from "ai";

export interface UltraChatbotAgentProjectDocsMcpToolbox {
  close: () => Promise<void>;
  tools: ToolSet;
}

function namespaceProjectDocsMcpTools(tools: ToolSet): ToolSet {
  return Object.fromEntries(
    Object.entries(tools).map(([name, tool]) => [`project__${name}`, tool])
  );
}

export async function createUltraChatbotAgentProjectDocsMcpToolbox({
  origin,
}: {
  origin: string;
}): Promise<UltraChatbotAgentProjectDocsMcpToolbox> {
  const client = await createMCPClient({
    clientName: "ultra-chatbot-agent-project-docs-client",
    transport: {
      type: "http",
      url: new URL(
        "/api/demos/ultra-chatbot-agent/mcp/project-docs",
        origin
      ).toString(),
    },
  });

  const tools = namespaceProjectDocsMcpTools((await client.tools()) as ToolSet);

  return {
    close: async () => {
      await client.close();
    },
    tools,
  };
}
