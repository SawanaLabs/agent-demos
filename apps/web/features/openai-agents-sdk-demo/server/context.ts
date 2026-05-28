import type { MemorySession, RunContext } from "@openai/agents";
import type { UIMessage } from "ai";
import { z } from "zod";

import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";

const defaultResearchTarget = "Tesla";
const maxPromptPreviewLength = 120;

export const openAiAgentsSdkDemoContextSummarySchema = z.object({
  defaultResearchTarget: z.literal(defaultResearchTarget),
  latestUserPromptPreview: z.string(),
  localContextKind: z.literal("RunContext"),
  researchMode: z.enum(["company-analysis", "general"]),
  sessionId: z.string(),
  sessionKind: z.literal("MemorySession"),
});

export interface OpenAiAgentsSdkDemoContextProfile {
  localContextPrimitive: "RunContext";
  passesContextInto: Array<
    "agent.asTool toolInput" | "dynamic instructions" | "guardrails" | "tool()"
  >;
  sessionBinding: "session-id";
  suggestedDefaultTarget: "Tesla";
}

export interface OpenAiAgentsSdkDemoContext {
  defaultResearchTarget: "Tesla";
  latestUserPrompt: string;
  latestUserPromptPreview: string;
  researchMode: "company-analysis" | "general";
  sessionId: string;
  sessionKind: "MemorySession";
}

function getLatestUserPrompt(messages: UIMessage[]) {
  return (
    [...messages]
      .reverse()
      .find((message) => message.role === "user")
      ?.parts.filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim() ?? ""
  );
}

function getPromptPreview(text: string) {
  if (text.length <= maxPromptPreviewLength) {
    return text;
  }

  return `${text.slice(0, maxPromptPreviewLength - 1)}...`;
}

function inferResearchMode(
  latestUserPrompt: string
): OpenAiAgentsSdkDemoContext["researchMode"] {
  if (
    /(company|stock|equity|earnings|valuation|financial|10-k|10q|tesla|分析|财务|投研|公司|研究|估值)/i.test(
      latestUserPrompt
    )
  ) {
    return "company-analysis";
  }

  return "general";
}

export async function createOpenAiAgentsSdkDemoContext({
  messages,
  session,
}: {
  messages: UIMessage[];
  session: Pick<MemorySession, "getSessionId">;
}): Promise<OpenAiAgentsSdkDemoContext> {
  const latestUserPrompt = getLatestUserPrompt(messages);

  return {
    defaultResearchTarget,
    latestUserPrompt,
    latestUserPromptPreview: getPromptPreview(latestUserPrompt),
    researchMode: inferResearchMode(latestUserPrompt),
    sessionId: await session.getSessionId(),
    sessionKind: "MemorySession",
  };
}

export function getOpenAiAgentsSdkDemoContextProfile(): OpenAiAgentsSdkDemoContextProfile {
  return {
    localContextPrimitive: "RunContext",
    passesContextInto: [
      "dynamic instructions",
      "tool()",
      "guardrails",
      "agent.asTool toolInput",
    ],
    sessionBinding: "session-id",
    suggestedDefaultTarget: "Tesla",
  };
}

export function getOpenAiAgentsSdkDemoContextInstructions(
  runContext: RunContext<OpenAiAgentsSdkDemoContext>,
  options: {
    isImageGenerationProviderBlocked: boolean;
  }
) {
  const context = runContext.context;
  const instructionLines = [
    `Current demo run mode: ${context.researchMode}.`,
    context.researchMode === "company-analysis"
      ? `If the user requests company research without naming a company, default to ${context.defaultResearchTarget}.`
      : "Keep the answer general unless the user explicitly asks for company research.",
  ];

  if (options.isImageGenerationProviderBlocked) {
    instructionLines.push(
      "The current AI Gateway Responses path cannot return a renderable image_generation artifact to this chat surface. For image-generation requests, explain that the official hosted tool is currently provider-blocked in this demo instead of claiming success."
    );
  }

  return instructionLines.join(" ");
}

export function getOpenAiAgentsSdkDemoToolContextNote(
  runContext?: RunContext<OpenAiAgentsSdkDemoContext>
) {
  const context = runContext?.context;

  if (!context) {
    return null;
  }

  return `Run context: ${context.researchMode}; default research target when unspecified: ${context.defaultResearchTarget}.`;
}

export function getOpenAiAgentsSdkDemoContextUsageMetadata(
  context: OpenAiAgentsSdkDemoContext
) {
  return {
    contextSummary: {
      defaultResearchTarget: context.defaultResearchTarget,
      latestUserPromptPreview: context.latestUserPromptPreview,
      localContextKind: "RunContext",
      researchMode: context.researchMode,
      sessionId: context.sessionId,
      sessionKind: context.sessionKind,
    },
    usedGuideIds: ["context"],
  } satisfies OpenAiAgentsSdkDemoMessageMetadata;
}
