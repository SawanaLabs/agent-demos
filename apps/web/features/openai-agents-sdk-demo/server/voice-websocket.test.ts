import { describe, expect, it } from "vitest";

import {
  buildOpenAiAgentsSdkDemoServerVoiceSession,
  getOpenAiAgentsSdkDemoServerVoiceSessionProfile,
} from "./voice-websocket";

describe("openai agents sdk demo server voice websocket transport", () => {
  it("exposes the official server websocket transport contract", () => {
    expect(getOpenAiAgentsSdkDemoServerVoiceSessionProfile()).toEqual({
      model: "gpt-realtime-2",
      openAiApiKeyEnvVar: "OPENAI_API_KEY",
      rawEventAccess: "session.transport.sendEvent()",
      sdkPrimitives: [
        "OpenAIRealtimeWebSocket",
        "RealtimeSession",
        "RealtimeSession.connect({ apiKey })",
      ],
      sessionVoice: "marin",
      status: "setup-required",
      transport: "WebSocket",
      useInsecureApiKey: true,
      workflowName: "openai-agents-sdk-demo-voice-websocket",
    });
  });

  it("fails early when the native OpenAI realtime key is missing", () => {
    expect(() => buildOpenAiAgentsSdkDemoServerVoiceSession()).toThrowError(
      "OPENAI_API_KEY is missing. Server-side Realtime WebSocket transport requires a native OpenAI API key."
    );
  });

  it("builds a real RealtimeSession on OpenAIRealtimeWebSocket when a native OpenAI key exists", async () => {
    const handle = buildOpenAiAgentsSdkDemoServerVoiceSession({
      OPENAI_API_KEY: "openai-key",
    });

    expect(handle.connectOptions).toEqual({
      apiKey: "openai-key",
      model: "gpt-realtime-2",
    });
    expect(handle.profile.status).toBe("configured");
    expect(handle.session.currentAgent.name).toBe("Voice Analyst");
    expect(handle.session.transport.constructor.name).toBe(
      "OpenAIRealtimeWebSocket"
    );
    await expect(
      handle.session.getInitialSessionConfig()
    ).resolves.toMatchObject({
      audio: {
        output: {
          voice: "marin",
        },
      },
      tools: expect.arrayContaining([
        expect.objectContaining({
          name: "build_research_brief",
        }),
        expect.objectContaining({
          name: "publish_research_summary",
        }),
      ]),
    });
  });
});
