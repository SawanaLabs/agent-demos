import {
  createAgentUIStreamResponse,
  stepCountIs,
  ToolLoopAgent,
  type UIMessage,
} from "ai";

import {
  resolveSandboxAgentChatModel,
  SANDBOX_AGENT_PROVIDER_OPTIONS,
} from "./model";
import { createSandboxAgentGateway, getSandboxAgentEnv } from "./env";
import { createSandboxAgentWorkspace } from "./workspace";

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
    env = getSandboxAgentEnv(),
    localPreviewBaseUrl,
    sessionId,
    previewPort,
  }: {
    env?: ReturnType<typeof getSandboxAgentEnv>;
    localPreviewBaseUrl?: string;
    previewPort?: number;
    sessionId: string;
  }
) {
  const gateway = createSandboxAgentGateway(env);
  const chatModel = resolveSandboxAgentChatModel(env);
  const workspace = await createSandboxAgentWorkspace({
    env,
    localPreviewBaseUrl,
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
