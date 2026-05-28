import { describe, expect, it } from "vitest";

import {
  createOpenAiAgentsSdkDemoTwilioMediaStreamServer,
  getOpenAiAgentsSdkDemoTwilioMediaStreamServerProfile,
} from "./voice-twilio-app";

describe("openai agents sdk demo twilio media-stream server", () => {
  it("exposes the official deployed websocket-server contract", () => {
    expect(getOpenAiAgentsSdkDemoTwilioMediaStreamServerProfile()).toEqual({
      healthcheckMessage: "Twilio Media Stream Server is running!",
      incomingCallRoutePath: "/incoming-call",
      mediaStreamRoutePath: "/media-stream",
      openAiApiKeyEnvVar: "OPENAI_API_KEY",
      publicTransportContract: "public-https-host + websocket-server",
      rootRoutePath: "/",
      sdkPrimitive: "TwilioRealtimeTransportLayer + RealtimeSession",
      serverPrimitive: "Fastify + @fastify/websocket",
      sourceGuide: "https://openai.github.io/openai-agents-js/extensions/twilio/",
      status: "setup-required",
      twimlTransport: "Twilio <Connect><Stream>",
      websocketProtocol: "wss",
      workflowName: "openai-agents-sdk-demo-voice-twilio",
    });
  });

  it("derives the Twilio media-stream websocket url from the public request host", async () => {
    const server = createOpenAiAgentsSdkDemoTwilioMediaStreamServer({
      OPENAI_API_KEY: "openai-key",
    });

    const response = await server.handleIncomingCallRequest(
      new Request("https://demo.example/incoming-call", {
        method: "POST",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.text()).resolves.toContain(
      '<Stream url="wss://demo.example/media-stream" />'
    );
  });

  it("creates and connects the realtime bridge for the media-stream websocket route", async () => {
    const connectCalls: unknown[] = [];
    const websocket = { addEventListener: () => {} } as unknown as WebSocket;
    const bridge = createOpenAiAgentsSdkDemoTwilioMediaStreamServer(
      {
        OPENAI_API_KEY: "openai-key",
      },
      {
        createBridge: (_env, connection) => {
          expect(connection).toBe(websocket);

          return {
            close: () => {},
            connect: async () => {
              connectCalls.push("connected");
            },
            getState: () => ({
              closeEventCount: 0,
              errorEventCount: 0,
              isConnected: true,
            }),
            profile: {
              closeBehavior: "session.close() on websocket close",
              connectPrimitive: "RealtimeSession.connect({ apiKey, model })",
              hostingContract: "external-websocket-server",
              openAiApiKeyEnvVar: "OPENAI_API_KEY",
              sdkPrimitive: "TwilioRealtimeTransportLayer + RealtimeSession",
              sourceGuide:
                "https://openai.github.io/openai-agents-js/extensions/twilio/",
              status: "configured",
              transport: "WebSocket",
              workflowName: "openai-agents-sdk-demo-voice-twilio",
            },
            session: {
              close: () => {},
              connect: async () => {},
            },
            transportName: "TwilioRealtimeTransportLayer",
          };
        },
      }
    );

    const connection = await bridge.connectMediaStream(websocket);

    expect(connection).toMatchObject({
      profile: expect.objectContaining({
        sdkPrimitive: "TwilioRealtimeTransportLayer + RealtimeSession",
      }),
      transportName: "TwilioRealtimeTransportLayer",
    });
    expect(connectCalls).toEqual(["connected"]);
  });
});
