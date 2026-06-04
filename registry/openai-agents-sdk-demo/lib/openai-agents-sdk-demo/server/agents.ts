import { Agent, type MCPServer } from "@openai/agents";

import {
  getOpenAiAgentsSdkDemoContextInstructions,
  type OpenAiAgentsSdkDemoContext,
} from "./context";
import { getOpenAiAgentsSdkDemoGuardrails } from "./guardrails";
import { createOpenAiAgentsSdkDemoHandoffs } from "./handoffs";
import {
  isOpenAiAgentsSdkDemoImageGenerationProviderBlocked,
  type OpenAiAgentsSdkDemoModelProfile,
} from "./models";
import { createOpenAiAgentsSdkDemoTools } from "./tools";

interface OpenAiAgentsSdkDemoAgentOptions {
  env?: Record<string, string | undefined>;
  mcpServers?: MCPServer[];
  modelProfile: OpenAiAgentsSdkDemoModelProfile;
}

const openAiAgentsSdkDemoInstructions = [
  "You are the OpenAI Agents SDK demo in an engineer-facing demo gallery.",
  "Answer clearly and briefly.",
  "Explain which part of the answer comes from the OpenAI Agents SDK runtime path only when the user asks for implementation detail.",
  "Do not mention internal helper or tool names such as web_search, web.run, code_interpreter, or agent.asTool unless the user explicitly asks how the demo is implemented.",
  "For time-sensitive public-company questions, use web_search before citing facts.",
  "For a brief web-search summary, use the hosted web_search tool directly and answer from the searched evidence.",
  "Use code_interpreter when calculations, tables, or comparisons would improve the answer.",
  "Use build_research_brief only at the start of an investment research or public-company company-analysis request.",
  "If the user asks to send or publish a finished research conclusion, use publish_research_summary and wait for approval before claiming it was shared.",
  "Use image_generation for image requests when the user asks for a generated image.",
  "Use MCP tools when the user asks about this demo's README, durable frontend doc, runtime contract, or MCP setup.",
  "If an MCP server is unavailable, explain that state plainly and continue without pretending the tools ran.",
  "Use research_memo_agent when you have enough evidence to synthesize a memo.",
  "Use sandbox_workspace_agent when the user needs repo-grounded inspection of the mounted demo docs or feature slice through a sandbox workspace.",
  "Use a handoff when one specialist should take over the conversation directly.",
  "Do not claim to have generated an image, file, or download unless the corresponding tool actually ran and the current chat surface can render that artifact.",
].join(" ");

export function createOpenAiAgentsSdkDemoAgent({
  env,
  mcpServers = [],
  modelProfile,
}: OpenAiAgentsSdkDemoAgentOptions) {
  const { inputGuardrails, outputGuardrails } =
    getOpenAiAgentsSdkDemoGuardrails();
  const isImageGenerationProviderBlocked =
    isOpenAiAgentsSdkDemoImageGenerationProviderBlocked(modelProfile);

  return new Agent<OpenAiAgentsSdkDemoContext>({
    inputGuardrails,
    instructions: (runContext) =>
      [
        openAiAgentsSdkDemoInstructions,
        getOpenAiAgentsSdkDemoContextInstructions(runContext, {
          isImageGenerationProviderBlocked,
        }),
      ].join(" "),
    model: modelProfile.model,
    modelSettings: {
      reasoning: {
        effort: modelProfile.reasoningEffort,
      },
      text: {
        verbosity: modelProfile.textVerbosity,
      },
    },
    mcpConfig: {
      convertSchemasToStrict: true,
      includeServerInToolNames: true,
    },
    mcpServers,
    name: "OpenAI Agents SDK Demo",
    outputGuardrails,
    handoffs: createOpenAiAgentsSdkDemoHandoffs({
      modelProfile,
    }),
    toolUseBehavior: "run_llm_again",
    tools: createOpenAiAgentsSdkDemoTools({
      env,
      modelProfile,
    }),
  });
}
