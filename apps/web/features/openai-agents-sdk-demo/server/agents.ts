import { Agent } from "@openai/agents";

import { getOpenAiAgentsSdkDemoGuardrails } from "./guardrails";
import {
  isOpenAiAgentsSdkDemoImageGenerationProviderBlocked,
  type OpenAiAgentsSdkDemoModelProfile,
} from "./models";
import { createOpenAiAgentsSdkDemoTools } from "./tools";

interface OpenAiAgentsSdkDemoAgentOptions {
  env?: Record<string, string | undefined>;
  modelProfile: OpenAiAgentsSdkDemoModelProfile;
}

const openAiAgentsSdkDemoInstructions = [
  "You are the OpenAI Agents SDK demo in an engineer-facing demo gallery.",
  "Answer clearly and briefly.",
  "Explain which part of the answer comes from the OpenAI Agents SDK runtime path only when the user asks for implementation detail.",
  "Do not mention internal helper or tool names such as web_search, web.run, code_interpreter, or agent.asTool unless the user explicitly asks how the demo is implemented.",
  "For time-sensitive public-company questions, use web_search before citing facts.",
  "Use code_interpreter when calculations, tables, or comparisons would improve the answer.",
  "Use build_research_brief at the start of a company-analysis request.",
  "Use image_generation for image requests when the user asks for a generated image.",
  "Use research_memo_agent when you have enough evidence to synthesize a memo.",
  "Do not claim to have generated an image, file, or download unless the corresponding tool actually ran and the current chat surface can render that artifact.",
].join(" ");

export function createOpenAiAgentsSdkDemoAgent({
  env,
  modelProfile,
}: OpenAiAgentsSdkDemoAgentOptions) {
  const { inputGuardrails, outputGuardrails } =
    getOpenAiAgentsSdkDemoGuardrails();
  const isImageGenerationProviderBlocked =
    isOpenAiAgentsSdkDemoImageGenerationProviderBlocked(modelProfile);
  const instructions = isImageGenerationProviderBlocked
    ? `${openAiAgentsSdkDemoInstructions} The current AI Gateway Responses path cannot return a renderable image_generation artifact to this chat surface. For image-generation requests, explain that the official hosted tool is currently provider-blocked in this demo instead of claiming success.`
    : openAiAgentsSdkDemoInstructions;

  return new Agent({
    inputGuardrails,
    instructions,
    model: modelProfile.model,
    modelSettings: {
      reasoning: {
        effort: modelProfile.reasoningEffort,
      },
      text: {
        verbosity: modelProfile.textVerbosity,
      },
    },
    name: "OpenAI Agents SDK Demo",
    outputGuardrails,
    tools: createOpenAiAgentsSdkDemoTools({
      env,
      modelProfile,
    }),
  });
}
