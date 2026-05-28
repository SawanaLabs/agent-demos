import { describe, expect, it } from "vitest";

import {
  getOpenAiAgentsSdkDemoRunInputErrorMessage,
  getOpenAiAgentsSdkDemoRunRequest,
} from "./running";

describe("openai agents sdk demo running helpers", () => {
  it("rejects normal agent runs that have no user input item", () => {
    expect(() =>
      getOpenAiAgentsSdkDemoRunRequest({
        messages: [
          {
            id: "a1",
            parts: [{ text: "Assistant-only history.", type: "text" }],
            role: "assistant",
          },
        ],
      }),
    ).toThrow("At least one user message is required");
  });

  it("identifies recoverable run input errors for the route handler", () => {
    let capturedError: unknown;

    try {
      getOpenAiAgentsSdkDemoRunRequest({ messages: [] });
    } catch (error) {
      capturedError = error;
    }

    expect(getOpenAiAgentsSdkDemoRunInputErrorMessage(capturedError)).toBe(
      "At least one user message is required before starting an agent run.",
    );
  });

  it("uses MemorySession-visible history instead of previousResponseId when the provider returns a non-Responses id", () => {
    expect(
      getOpenAiAgentsSdkDemoRunRequest({
        messages: [
          {
            id: "u1",
            parts: [{ text: "Remember bluefin.", type: "text" }],
            role: "user",
          },
          {
            id: "a1",
            metadata: {
              lastResponseId: "gen_gateway_123",
              sessionSummary: {
                historyItemCount: 2,
                sessionId: "session_demo_1",
                sessionKind: "MemorySession",
                storageScope: "process-local",
              },
            },
            parts: [{ text: "Remembered.", type: "text" }],
            role: "assistant",
          },
          {
            id: "u2",
            parts: [{ text: "What was it?", type: "text" }],
            role: "user",
          },
        ],
      }),
    ).toEqual({
      input: [
        {
          content: "What was it?",
          role: "user",
        },
      ],
      options: {
        maxTurns: 8,
        stream: true,
      },
    });
  });

  it("uses previousResponseId when the assistant metadata carries a Responses API id", () => {
    expect(
      getOpenAiAgentsSdkDemoRunRequest({
        messages: [
          {
            id: "u1",
            parts: [{ text: "Remember bluefin.", type: "text" }],
            role: "user",
          },
          {
            id: "a1",
            metadata: {
              lastResponseId: "resp_123",
            },
            parts: [{ text: "Remembered.", type: "text" }],
            role: "assistant",
          },
          {
            id: "u2",
            parts: [{ text: "What was it?", type: "text" }],
            role: "user",
          },
        ],
      }),
    ).toEqual({
      input: [
        {
          content: "What was it?",
          role: "user",
        },
      ],
      options: {
        maxTurns: 8,
        previousResponseId: "resp_123",
        stream: true,
      },
    });
  });
});
