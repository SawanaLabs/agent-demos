import { RealtimeSession } from "@openai/agents/realtime";
import { describe, expect, it, vi } from "vitest";

import {
  buildOpenAiAgentsSdkDemoCloudflareVoiceSession,
  buildOpenAiAgentsSdkDemoTwilioVoiceSession,
  getOpenAiAgentsSdkDemoVoiceExtensionProfiles,
} from "./voice-extensions";

describe("openai agents sdk demo voice extension transports", () => {
  it("exposes the official Twilio and Cloudflare transport profiles for the runtime inspector", () => {
    expect(getOpenAiAgentsSdkDemoVoiceExtensionProfiles()).toEqual([
      {
        credentialContract: "server-api-key",
        id: "cloudflare",
        label: "Cloudflare Workers",
        openAiApiKeyEnvVar: "OPENAI_API_KEY",
        runtimeContract: "cloudflare-worker-runtime",
        sdkPrimitive: "CloudflareRealtimeTransportLayer",
        sourceGuide:
          "https://openai.github.io/openai-agents-js/extensions/cloudflare/",
        status: "setup-required",
        transport: "WebSocket",
        workflowName: "openai-agents-sdk-demo-voice-cloudflare",
      },
      {
        credentialContract: "server-api-key",
        id: "twilio",
        label: "Twilio Media Streams",
        openAiApiKeyEnvVar: "OPENAI_API_KEY",
        runtimeContract: "bring-your-own-websocket-server",
        sdkPrimitive: "TwilioRealtimeTransportLayer",
        sourceGuide:
          "https://openai.github.io/openai-agents-js/extensions/twilio/",
        status: "setup-required",
        transport: "WebSocket",
        workflowName: "openai-agents-sdk-demo-voice-twilio",
      },
    ]);
  });

  it("builds a Cloudflare realtime session around the official transport layer", () => {
    const handle = buildOpenAiAgentsSdkDemoCloudflareVoiceSession({
      OPENAI_API_KEY: "openai-key",
    });

    expect(handle.profile).toMatchObject({
      id: "cloudflare",
      status: "configured",
      workflowName: "openai-agents-sdk-demo-voice-cloudflare",
    });
    expect(handle.connectOptions).toEqual({
      apiKey: "openai-key",
      model: "gpt-realtime-2",
    });
    expect(handle.session).toBeInstanceOf(RealtimeSession);
    expect(handle.transport.constructor.name).toBe(
      "CloudflareRealtimeTransportLayer"
    );
  });

  it("builds a Twilio realtime session around the official transport layer", () => {
    const twilioWebSocket = {
      addEventListener: vi.fn(),
      send: vi.fn(),
    } as unknown as WebSocket;

    const handle = buildOpenAiAgentsSdkDemoTwilioVoiceSession({
      env: {
        OPENAI_API_KEY: "openai-key",
      },
      twilioWebSocket,
    });

    expect(handle.profile).toMatchObject({
      id: "twilio",
      status: "configured",
      workflowName: "openai-agents-sdk-demo-voice-twilio",
    });
    expect(handle.connectOptions).toEqual({
      apiKey: "openai-key",
      model: "gpt-realtime-2",
    });
    expect(handle.session).toBeInstanceOf(RealtimeSession);
    expect(handle.transport.constructor.name).toBe(
      "TwilioRealtimeTransportLayer"
    );
  });

  it("fails fast when OPENAI_API_KEY is missing", () => {
    expect(() => buildOpenAiAgentsSdkDemoCloudflareVoiceSession({})).toThrow(
      /OPENAI_API_KEY/i
    );
    expect(() =>
      buildOpenAiAgentsSdkDemoTwilioVoiceSession({
        env: {},
        twilioWebSocket: {
          addEventListener: vi.fn(),
          send: vi.fn(),
        } as unknown as WebSocket,
      })
    ).toThrow(/OPENAI_API_KEY/i);
  });
});
