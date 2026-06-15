import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, tool, type UIMessage } from "ai";

import {
  createFeatureComparison,
  createPlanRecommendation,
  featureComparisonInputSchema,
  planRecommendationInputSchema,
} from "@/lib/generative-ui/ui-contract";
import {
  type GenerativeUiEnv,
  getGenerativeUiConfig,
  getGenerativeUiEnv,
} from "./env";
import {
  GENERATIVE_UI_PROVIDER_OPTIONS,
  GENERATIVE_UI_SEARCH_TOOL_NAME,
} from "./model";

const systemPrompt = [
  "You are the Generative UI Agent Demo.",
  "Answer broad user questions directly and choose visual tool output when a comparison or recommendation would make the answer easier to evaluate.",
  "Use web_search when current public information would materially improve the answer, including market, pricing, release, competitor, or time-sensitive questions.",
  "Skip web_search for stable technical, architectural, or domain-knowledge questions where durable reasoning is enough.",
  "Use showFeatureComparison for comparisons across options, criteria, capabilities, or tradeoffs.",
  "Use showPlanRecommendation when the user asks what to pick, what to do next, or which option fits best.",
  "When web_search informs the answer, rely on the message-level source channel for citations and keep source URLs out of the selected UI tool input.",
  "Keep surrounding prose concise; let the selected UI tool carry the main answer.",
].join(" ");

const trailingSlashPattern = /\/$/;
const v3AiSuffixPattern = /\/v3\/ai$/;

function resolveOpenAICompatibleBaseURL(baseURL: string) {
  const normalizedBaseURL = baseURL.replace(trailingSlashPattern, "");

  if (normalizedBaseURL.endsWith("/v1")) {
    return normalizedBaseURL;
  }

  if (normalizedBaseURL.endsWith("/v3/ai")) {
    return normalizedBaseURL.replace(v3AiSuffixPattern, "/v1");
  }

  throw new Error(
    `Generative UI expects AI_GATEWAY_BASE_URL to end with /v3/ai or /v1. Received: ${baseURL}`
  );
}

function summarizeFeatureComparisonOutput(output: unknown) {
  if (!output || typeof output !== "object") {
    return;
  }

  const comparison = output as {
    kind?: unknown;
    subject?: unknown;
    summary?: unknown;
  };

  if (
    comparison.kind !== "feature-comparison" ||
    typeof comparison.subject !== "string" ||
    typeof comparison.summary !== "string"
  ) {
    return;
  }

  return `Displayed comparison: ${comparison.subject}. ${comparison.summary}`;
}

function summarizePlanRecommendationOutput(output: unknown) {
  if (!output || typeof output !== "object") {
    return;
  }

  const recommendation = output as {
    decision?: unknown;
    kind?: unknown;
    recommendedOption?: {
      name?: unknown;
      summary?: unknown;
    };
  };

  if (
    recommendation.kind !== "plan-recommendation" ||
    typeof recommendation.decision !== "string" ||
    typeof recommendation.recommendedOption?.name !== "string"
  ) {
    return;
  }

  const summary =
    typeof recommendation.recommendedOption.summary === "string"
      ? ` ${recommendation.recommendedOption.summary}`
      : "";

  return `Displayed recommendation for ${recommendation.decision}: ${recommendation.recommendedOption.name}.${summary}`;
}

function summarizeGenerativeUiToolOutput(
  part: UIMessage["parts"][number]
): string | undefined {
  if (!("output" in part) || part.state !== "output-available") {
    return;
  }

  if (part.type === "tool-showFeatureComparison") {
    return summarizeFeatureComparisonOutput(part.output);
  }

  if (part.type === "tool-showPlanRecommendation") {
    return summarizePlanRecommendationOutput(part.output);
  }

  return;
}

function isNonEmptyTextPart(
  part: UIMessage["parts"][number]
): part is UIMessage["parts"][number] & { text: string; type: "text" } {
  return (
    part.type === "text" &&
    "text" in part &&
    typeof part.text === "string" &&
    part.text.trim().length > 0
  );
}

function getModelHistoryTextParts(message: UIMessage) {
  const textParts = message.parts.filter(isNonEmptyTextPart).map((part) => ({
    text: part.text,
    type: "text" as const,
  }));

  const toolSummaries = message.parts
    .map(summarizeGenerativeUiToolOutput)
    .filter((text): text is string => Boolean(text))
    .map((text) => ({
      text,
      type: "text" as const,
    }));

  return [...textParts, ...toolSummaries];
}

export function prepareGenerativeUiModelMessages(messages: UIMessage[]) {
  return messages
    .map((message) => ({
      ...message,
      parts: getModelHistoryTextParts(message),
    }))
    .filter(
      (message) => message.role === "user" || message.parts.length > 0
    ) satisfies UIMessage[];
}

export async function streamGenerativeUiChat(
  messages: UIMessage[],
  env: GenerativeUiEnv = getGenerativeUiEnv()
) {
  const { apiKey, baseURL, chatModel } = getGenerativeUiConfig(env);
  const openai = createOpenAI({
    apiKey,
    baseURL: resolveOpenAICompatibleBaseURL(baseURL),
    name: "gateway-openai",
  });
  const runId = crypto.randomUUID();
  const startedAt = Date.now();
  const messageMetadataBase = {
    model: chatModel,
    runId,
    searchTool: GENERATIVE_UI_SEARCH_TOOL_NAME,
    startedAt,
  };

  const result = streamText({
    experimental_telemetry: {
      functionId: "generative-ui.run",
      isEnabled: true,
      metadata: {
        demo: "generative-ui",
        runId,
        searchTool: GENERATIVE_UI_SEARCH_TOOL_NAME,
      },
      recordInputs: true,
      recordOutputs: true,
    },
    messages: await convertToModelMessages(
      prepareGenerativeUiModelMessages(messages)
    ),
    model: openai(chatModel),
    providerOptions: GENERATIVE_UI_PROVIDER_OPTIONS,
    system: systemPrompt,
    tools: {
      [GENERATIVE_UI_SEARCH_TOOL_NAME]: openai.tools.webSearch({
        searchContextSize: "medium",
      }),
      showFeatureComparison: tool({
        description:
          "Render a structured comparison matrix for options, criteria, and tradeoffs.",
        inputSchema: featureComparisonInputSchema,
        execute: createFeatureComparison,
      }),
      showPlanRecommendation: tool({
        description:
          "Render a structured recommendation card for a decision, rationale, risks, and next steps.",
        inputSchema: planRecommendationInputSchema,
        execute: createPlanRecommendation,
      }),
    },
  });

  return result.toUIMessageStreamResponse({
    messageMetadata: ({ part }) => {
      if (part.type === "start") {
        return messageMetadataBase;
      }

      if (part.type === "finish") {
        return {
          ...messageMetadataBase,
          finishReason: part.finishReason,
          finishedAt: Date.now(),
          totalUsage: part.totalUsage,
        };
      }

      return;
    },
    originalMessages: messages,
    sendReasoning: true,
    sendSources: true,
  });
}
