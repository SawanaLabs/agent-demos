import { describe, expect, it } from "vitest";

import { getOpenAiAgentsSdkDemoVoiceHistorySummary } from "./openai-agents-sdk-demo-voice-utils";

describe("openai agents sdk demo voice history summary", () => {
  it("extracts the latest user and assistant transcripts from realtime history", () => {
    expect(
      getOpenAiAgentsSdkDemoVoiceHistorySummary([
        {
          content: [
            {
              transcript: "Hello from the microphone",
              type: "input_audio",
            },
          ],
          itemId: "user-1",
          role: "user",
          status: "completed",
          type: "message",
        },
        {
          content: [
            {
              transcript: "Hello from the assistant",
              type: "output_audio",
            },
          ],
          itemId: "assistant-1",
          role: "assistant",
          status: "completed",
          type: "message",
        },
      ])
    ).toEqual({
      historyItemCount: 2,
      lastAssistantTranscript: "Hello from the assistant",
      lastUserTranscript: "Hello from the microphone",
    });
  });

  it("falls back to text content when no audio transcript exists", () => {
    expect(
      getOpenAiAgentsSdkDemoVoiceHistorySummary([
        {
          content: [
            {
              text: "Summarize Tesla's latest quarter.",
              type: "input_text",
            },
          ],
          itemId: "user-2",
          role: "user",
          status: "completed",
          type: "message",
        },
        {
          content: [
            {
              text: "Revenue was up year over year.",
              type: "output_text",
            },
          ],
          itemId: "assistant-2",
          role: "assistant",
          status: "completed",
          type: "message",
        },
      ])
    ).toEqual({
      historyItemCount: 2,
      lastAssistantTranscript: "Revenue was up year over year.",
      lastUserTranscript: "Summarize Tesla's latest quarter.",
    });
  });
});
