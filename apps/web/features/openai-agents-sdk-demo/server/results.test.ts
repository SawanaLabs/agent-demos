import { describe, expect, it } from "vitest";

import { getOpenAiAgentsSdkDemoResultUsageMetadata } from "./results";

describe("openai agents sdk demo results", () => {
  it("maps settled streamed-run surfaces into result metadata", () => {
    expect(
      getOpenAiAgentsSdkDemoResultUsageMetadata({
        activeAgentName: "Research Lead Agent",
        finalOutput: {
          summary: "Tesla margin pressure is still the core open question.",
        },
        hasResumableState: true,
        historyLength: 6,
        interruptionCount: 0,
        lastAgentName: "Research Lead Agent",
        newItemsCount: 4,
        outputCount: 2,
        rawResponseCount: 2,
        usage: {
          inputTokens: 321,
          outputTokens: 123,
          requests: 2,
          totalTokens: 444,
        },
      })
    ).toEqual({
      resultSummary: {
        activeAgentName: "Research Lead Agent",
        finalOutputPreview:
          '{"summary":"Tesla margin pressure is still the core open question."}',
        hasResumableState: true,
        historyLength: 6,
        inputTokens: 321,
        interruptionCount: 0,
        lastAgentName: "Research Lead Agent",
        newItemsCount: 4,
        outputCount: 2,
        outputTokens: 123,
        rawResponseCount: 2,
        requestCount: 2,
        totalTokens: 444,
      },
      usedGuideIds: ["results"],
    });
  });
});
