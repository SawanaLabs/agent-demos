import { describe, expect, it } from "vitest";

import {
  createOpenAiAgentsSdkDemoContext,
  getOpenAiAgentsSdkDemoContextInstructions,
  getOpenAiAgentsSdkDemoContextUsageMetadata,
  getOpenAiAgentsSdkDemoToolContextNote,
} from "./context";

describe("openai agents sdk demo context", () => {
  it("builds a typed run context from the latest user turn and session id", async () => {
    await expect(
      createOpenAiAgentsSdkDemoContext({
        messages: [
          {
            id: "u1",
            parts: [{ text: "Hi there", type: "text" }],
            role: "user",
          },
          {
            id: "a1",
            parts: [{ text: "Hello", type: "text" }],
            role: "assistant",
          },
          {
            id: "u2",
            parts: [
              {
                text: "Analyze Tesla's latest earnings and tell me the key risks.",
                type: "text",
              },
            ],
            role: "user",
          },
        ],
        session: {
          getSessionId: async () => "session_demo_42",
        },
      })
    ).resolves.toEqual({
      defaultResearchTarget: "Tesla",
      latestUserPrompt:
        "Analyze Tesla's latest earnings and tell me the key risks.",
      latestUserPromptPreview:
        "Analyze Tesla's latest earnings and tell me the key risks.",
      researchMode: "company-analysis",
      sessionId: "session_demo_42",
      sessionKind: "MemorySession",
    });
  });

  it("returns usage metadata for the Context Management guide", () => {
    expect(
      getOpenAiAgentsSdkDemoContextUsageMetadata({
        defaultResearchTarget: "Tesla",
        latestUserPrompt: "Give me a general overview.",
        latestUserPromptPreview: "Give me a general overview.",
        researchMode: "general",
        sessionId: "session_demo_7",
        sessionKind: "MemorySession",
      })
    ).toEqual({
      contextSummary: {
        defaultResearchTarget: "Tesla",
        latestUserPromptPreview: "Give me a general overview.",
        localContextKind: "RunContext",
        researchMode: "general",
        sessionId: "session_demo_7",
        sessionKind: "MemorySession",
      },
      usedGuideIds: ["context"],
    });
  });

  it("formats dynamic instructions and tool notes from RunContext", () => {
    const runContext = {
      context: {
        defaultResearchTarget: "Tesla",
        latestUserPrompt: "Research a company for me.",
        latestUserPromptPreview: "Research a company for me.",
        researchMode: "company-analysis",
        sessionId: "session_demo_9",
        sessionKind: "MemorySession",
      },
      toolInput: {
        company: "Tesla",
      },
    } as const;

    expect(
      getOpenAiAgentsSdkDemoContextInstructions(runContext as never, {
        isImageGenerationProviderBlocked: true,
      })
    ).toContain("default to Tesla");
    expect(
      getOpenAiAgentsSdkDemoContextInstructions(runContext as never, {
        isImageGenerationProviderBlocked: true,
      })
    ).toContain("provider-blocked");
    expect(getOpenAiAgentsSdkDemoToolContextNote(runContext as never)).toBe(
      "Run context: company-analysis; default research target when unspecified: Tesla."
    );
  });
});
