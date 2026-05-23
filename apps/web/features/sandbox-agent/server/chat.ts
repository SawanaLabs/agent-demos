import {
  createAgentUIStreamResponse,
  stepCountIs,
  ToolLoopAgent,
  type UIMessage,
} from "ai";

import { createAiGateway } from "@/features/shared/ai-gateway/server/env";
import {
  resolveSandboxAgentChatModel,
  SANDBOX_AGENT_PROVIDER_OPTIONS,
} from "./model";
import { createSandboxAgentWorkspace } from "./workspace";

type DemoEnv = Record<string, string | undefined>;

export const sandboxAgentInstructions = [
  "You are the sandbox-agent demo for a product and engineering team.",
  "Work like a focused frontend prototyper inside the sandbox workspace.",
  "Prefer plain HTML, CSS, and JavaScript unless the user asks for something heavier.",
  "Use writeFile and readFile for direct file editing, and use bash for scaffold, inspection, and iterative code changes.",
  "After the prototype is previewable, call startPreview so the workspace can show the live result.",
  "Keep the final answer concise and report the main files created or updated.",
].join(" ");

export async function streamSandboxAgent(
  messages: UIMessage[],
  {
    env = process.env,
    sessionId,
    previewPort,
  }: {
    env?: DemoEnv;
    previewPort?: number;
    sessionId: string;
  }
) {
  const gateway = createAiGateway(env);
  const chatModel = resolveSandboxAgentChatModel(env);
  const workspace = await createSandboxAgentWorkspace({
    env,
    sessionId,
  });
  const agent = new ToolLoopAgent({
    instructions: sandboxAgentInstructions,
    model: gateway(chatModel),
    prepareCall: ({ ...call }) => ({
      ...call,
      instructions: [
        sandboxAgentInstructions,
        `Sandbox project root: ${workspace.projectRoot}`,
        `Default artifacts root: ${workspace.artifactsRoot}`,
        `Preview port: ${previewPort ?? workspace.previewPort}`,
        `Suggested use cases:\n${workspace.suggestedUseCasesText}`,
      ].join("\n\n"),
    }),
    providerOptions: SANDBOX_AGENT_PROVIDER_OPTIONS,
    stopWhen: stepCountIs(8),
    tools: workspace.toolset.tools,
  });

  return await createAgentUIStreamResponse({
    agent,
    sendReasoning: true,
    uiMessages: messages,
  });
}
