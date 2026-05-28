import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";

function getFinalOutputPreview(finalOutput: unknown) {
  if (typeof finalOutput === "undefined") {
    return undefined;
  }

  const text =
    typeof finalOutput === "string"
      ? finalOutput
      : JSON.stringify(finalOutput, null, 0);

  const normalizedText = text.trim();

  if (normalizedText.length <= 240) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, 237)}...`;
}

export function getOpenAiAgentsSdkDemoResultUsageMetadata({
  activeAgentName,
  finalOutput,
  hasResumableState,
  historyLength,
  interruptionCount,
  lastAgentName,
  newItemsCount,
  outputCount,
  rawResponseCount,
  usage,
}: {
  activeAgentName?: string;
  finalOutput?: unknown;
  hasResumableState: boolean;
  historyLength: number;
  interruptionCount: number;
  lastAgentName?: string;
  newItemsCount: number;
  outputCount: number;
  rawResponseCount: number;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    requests?: number;
    totalTokens?: number;
  };
}): OpenAiAgentsSdkDemoMessageMetadata {
  return {
    resultSummary: {
      ...(activeAgentName ? { activeAgentName } : {}),
      ...(typeof finalOutput !== "undefined"
        ? {
            finalOutputPreview: getFinalOutputPreview(finalOutput),
          }
        : {}),
      hasResumableState,
      historyLength,
      inputTokens: usage?.inputTokens ?? 0,
      interruptionCount,
      ...(lastAgentName ? { lastAgentName } : {}),
      newItemsCount,
      outputCount,
      outputTokens: usage?.outputTokens ?? 0,
      rawResponseCount,
      requestCount: usage?.requests ?? 0,
      totalTokens: usage?.totalTokens ?? 0,
    },
    usedGuideIds: ["results"],
  };
}
