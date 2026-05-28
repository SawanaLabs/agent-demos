import { describe, expect, it } from "vitest";

import {
  createOpenAiAgentsSdkDemoTwilioMediaStreamBridge,
  getOpenAiAgentsSdkDemoTwilioMediaStreamBridgeProfile,
} from "./voice-twilio-bridge";

describe("openai agents sdk demo twilio media-stream bridge", () => {
  it("exposes the official Twilio websocket bridge contract", () => {
    expect(getOpenAiAgentsSdkDemoTwilioMediaStreamBridgeProfile()).toEqual({
      closeBehavior: "session.close() on websocket close",
      connectPrimitive: "RealtimeSession.connect({ apiKey, model })",
      hostingContract: "external-websocket-server",
      openAiApiKeyEnvVar: "OPENAI_API_KEY",
      sdkPrimitive: "TwilioRealtimeTransportLayer + RealtimeSession",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/extensions/twilio/",
      status: "setup-required",
      transport: "WebSocket",
      workflowName: "openai-agents-sdk-demo-voice-twilio",
    });
  });

  it("connects the realtime session and closes it when the websocket closes", async () => {
    const listeners = new Map<string, Set<() => void>>();
    const connectCalls: unknown[] = [];
    let closeCount = 0;

    const bridge = createOpenAiAgentsSdkDemoTwilioMediaStreamBridge(
      {
        OPENAI_API_KEY: "openai-key",
      },
      {
        buildSessionHandle: () =>
          ({
            connectOptions: {
              apiKey: "openai-key",
              model: "gpt-realtime-2",
            },
            profile: {
              credentialContract: "server-api-key",
              id: "twilio",
              label: "Twilio Media Streams",
              openAiApiKeyEnvVar: "OPENAI_API_KEY",
              runtimeContract: "bring-your-own-websocket-server",
              sdkPrimitive: "TwilioRealtimeTransportLayer",
              sourceGuide:
                "https://openai.github.io/openai-agents-js/extensions/twilio/",
              status: "configured",
              transport: "WebSocket",
              workflowName: "openai-agents-sdk-demo-voice-twilio",
            },
            session: {
              close: () => {
                closeCount += 1;
              },
              connect: async (options: unknown) => {
                connectCalls.push(options);
              },
            },
            transport: {
              constructor: {
                name: "TwilioRealtimeTransportLayer",
              },
            },
          }) as any,
      },
      {
        addEventListener: (event: string, listener: () => void) => {
          const bucket = listeners.get(event) ?? new Set();

          bucket.add(listener);
          listeners.set(event, bucket);
        },
        send: () => {},
      } as unknown as WebSocket
    );

    await bridge.connect();

    expect(connectCalls).toEqual([
      {
        apiKey: "openai-key",
        model: "gpt-realtime-2",
      },
    ]);
    expect(bridge.getState()).toEqual({
      closeEventCount: 0,
      errorEventCount: 0,
      isConnected: true,
    });

    listeners.get("close")?.forEach((listener) => listener());

    expect(closeCount).toBe(1);
    expect(bridge.getState()).toEqual({
      closeEventCount: 1,
      errorEventCount: 0,
      isConnected: false,
    });
  });
});
