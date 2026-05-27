import {
  createAgentUIStreamResponse,
  stepCountIs,
  ToolLoopAgent,
  type UIMessage,
} from "ai";
import { createMcpAgentGateway, getMcpAgentEnv } from "./env";
import { createMcpAgentToolbox } from "./mcp-clients";
import { formatMcpRuntimeSummary } from "./mcp-toolbox";
import { MCP_AGENT_PROVIDER_OPTIONS, resolveMcpAgentChatModel } from "./model";

type DemoEnv = Record<string, string | undefined>;

export const mcpAgentInstructions = [
  "You are the MCP Runtime Doctor Agent demo for a product and engineering team.",
  "Use the connected MCP tools naturally when they can ground the answer in project docs, demo metadata, or local Next.js runtime state.",
  "Do not ask the user to choose a mode. Infer whether project docs, runtime diagnostics, or both are relevant from the message.",
  "When a requested MCP server is unavailable, explain the visible status and continue with available MCP tools when useful.",
  "Keep answers concise and cite the MCP tool evidence you used in plain language.",
].join(" ");

export async function streamMcpAgent(
  messages: UIMessage[],
  {
    env = getMcpAgentEnv(),
    origin,
  }: {
    env?: DemoEnv;
    origin: string;
  }
) {
  const gateway = createMcpAgentGateway(env);
  const chatModel = resolveMcpAgentChatModel(env);
  const toolbox = await createMcpAgentToolbox({ origin });
  const agent = new ToolLoopAgent({
    instructions: mcpAgentInstructions,
    model: gateway(chatModel),
    prepareCall: ({ ...call }) => ({
      ...call,
      instructions: [
        mcpAgentInstructions,
        `Connected MCP servers and tools:\n${formatMcpRuntimeSummary(
          toolbox.summary
        )}`,
      ].join("\n\n"),
    }),
    providerOptions: MCP_AGENT_PROVIDER_OPTIONS,
    stopWhen: stepCountIs(20),
    tools: toolbox.tools,
  });

  return await createAgentUIStreamResponse({
    agent,
    onFinish: async () => {
      await toolbox.close();
    },
    sendReasoning: true,
    uiMessages: messages,
  });
}
