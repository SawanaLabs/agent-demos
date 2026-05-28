import { RealtimeSession } from "@openai/agents/realtime";
import { describe, expect, it } from "vitest";

import {
  buildOpenAiAgentsSdkDemoSipInitialConfig,
  buildOpenAiAgentsSdkDemoSipVoiceSession,
  getOpenAiAgentsSdkDemoSipVoiceSessionProfile,
} from "./voice-sip";

describe("openai agents sdk demo SIP voice transport", () => {
  it("exposes the official SIP transport profile for the runtime inspector", () => {
    expect(getOpenAiAgentsSdkDemoSipVoiceSessionProfile()).toEqual({
      callControlContract: "provider-or-openai-call-accept-route",
      connectPrimitive: "RealtimeSession.connect({ apiKey, callId })",
      initialConfigPrimitive: "OpenAIRealtimeSIP.buildInitialConfig()",
      model: "gpt-realtime-2",
      openAiApiKeyEnvVar: "OPENAI_API_KEY",
      routePath: "/api/demos/openai-agents-sdk-demo/realtime/sip",
      sessionVoice: "marin",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/guides/voice-agents/transport/",
      status: "setup-required",
      transport: "SIP",
      workflowName: "openai-agents-sdk-demo-voice-sip",
    });
  });

  it("builds the initial SIP call-accept payload from the official helper", async () => {
    const payload = await buildOpenAiAgentsSdkDemoSipInitialConfig();

    expect(payload).toMatchObject({
      audio: {
        output: {
          voice: "marin",
        },
      },
      type: "realtime",
    });
  });

  it("builds a SIP realtime session handle around OpenAIRealtimeSIP", () => {
    const handle = buildOpenAiAgentsSdkDemoSipVoiceSession({
      callId: "call_123",
      env: {
        OPENAI_API_KEY: "openai-key",
      },
    });

    expect(handle.profile).toMatchObject({
      status: "configured",
      workflowName: "openai-agents-sdk-demo-voice-sip",
    });
    expect(handle.connectOptions).toEqual({
      apiKey: "openai-key",
      callId: "call_123",
      model: "gpt-realtime-2",
    });
    expect(handle.session).toBeInstanceOf(RealtimeSession);
    expect(handle.transport.constructor.name).toBe("OpenAIRealtimeSIP");
  });

  it("fails fast when OPENAI_API_KEY or callId is missing", () => {
    expect(() =>
      buildOpenAiAgentsSdkDemoSipVoiceSession({
        callId: "call_123",
        env: {},
      })
    ).toThrow(/OPENAI_API_KEY/i);

    expect(() =>
      buildOpenAiAgentsSdkDemoSipVoiceSession({
        callId: "",
        env: {
          OPENAI_API_KEY: "openai-key",
        },
      })
    ).toThrow(/callId/i);
  });
});
