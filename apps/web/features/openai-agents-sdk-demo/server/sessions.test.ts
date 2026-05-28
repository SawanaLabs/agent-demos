import { beforeEach, describe, expect, it } from "vitest";

import {
  clearOpenAiAgentsSdkDemoSessionStore,
  getOpenAiAgentsSdkDemoSession,
  getOpenAiAgentsSdkDemoSessionProfile,
  getOpenAiAgentsSdkDemoSessionUsageMetadata,
} from "./sessions";

describe("openai agents sdk demo sessions", () => {
  beforeEach(() => {
    clearOpenAiAgentsSdkDemoSessionStore();
  });

  it("creates a MemorySession and reports official session metadata", async () => {
    const session = await getOpenAiAgentsSdkDemoSession([
      {
        id: "u1",
        parts: [{ text: "Analyze Tesla.", type: "text" }],
        role: "user",
      },
    ]);

    const metadata = await getOpenAiAgentsSdkDemoSessionUsageMetadata(session);

    expect(getOpenAiAgentsSdkDemoSessionProfile()).toEqual({
      historyStorage: "process-local",
      sdkPrimitive: "MemorySession",
      sessionTransport: "assistant-message metadata",
      supportsCrudHelpers: true,
    });
    expect(metadata).toMatchObject({
      sessionSummary: {
        historyItemCount: 0,
        sessionId: expect.any(String),
        sessionKind: "MemorySession",
        storageScope: "process-local",
      },
      usedGuideIds: ["sessions"],
    });
  });

  it("reuses an in-process session when the latest assistant metadata carries its session id", async () => {
    const session = await getOpenAiAgentsSdkDemoSession([]);
    const metadata = await getOpenAiAgentsSdkDemoSessionUsageMetadata(session);

    const resumedSession = await getOpenAiAgentsSdkDemoSession([
      {
        id: "a1",
        metadata,
        parts: [{ text: "Previous answer.", type: "text" }],
        role: "assistant",
      },
      {
        id: "u1",
        parts: [{ text: "Continue.", type: "text" }],
        role: "user",
      },
    ]);

    expect(resumedSession).toBe(session);
  });

  it("rehydrates a missing process-local session from visible transcript history", async () => {
    const session = await getOpenAiAgentsSdkDemoSession([]);
    const metadata = await getOpenAiAgentsSdkDemoSessionUsageMetadata(session);

    clearOpenAiAgentsSdkDemoSessionStore();

    const rehydratedSession = await getOpenAiAgentsSdkDemoSession([
      {
        id: "u1",
        parts: [{ text: "What happened to Tesla revenue?", type: "text" }],
        role: "user",
      },
      {
        id: "a1",
        metadata,
        parts: [{ text: "Tesla revenue grew year over year.", type: "text" }],
        role: "assistant",
      },
      {
        id: "u2",
        parts: [{ text: "Now focus on margins.", type: "text" }],
        role: "user",
      },
    ]);

    await expect(rehydratedSession.getItems()).resolves.toEqual([
      {
        content: "What happened to Tesla revenue?",
        role: "user",
      },
      {
        content: [
          {
            text: "Tesla revenue grew year over year.",
            type: "output_text",
          },
        ],
        role: "assistant",
        status: "completed",
      },
    ]);
  });
});
