import { describe, expect, it } from "vitest";

import {
  createOpenAiAgentsSdkDemoCloudflareWorkerRuntime,
  getOpenAiAgentsSdkDemoCloudflareWorkerProfile,
} from "./voice-cloudflare-worker";

describe("openai agents sdk demo cloudflare voice worker", () => {
  it("exposes the official Cloudflare worker runtime contract", () => {
    expect(getOpenAiAgentsSdkDemoCloudflareWorkerProfile()).toEqual({
      connectPrimitive: "RealtimeSession.connect({ apiKey, model })",
      openAiApiKeyEnvVar: "OPENAI_API_KEY",
      openEventBehavior: "skipOpenEventListeners: true",
      runtimeEntryPoint: "Cloudflare Worker fetch()",
      sdkPrimitive: "CloudflareRealtimeTransportLayer + RealtimeSession",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/extensions/cloudflare/",
      status: "setup-required",
      transport: "WebSocket",
      websocketUpgradePrimitive: "fetch() + Upgrade: websocket",
      workerCompatibilityFlag: "nodejs_compat",
      workflowName: "openai-agents-sdk-demo-voice-cloudflare",
    });
  });

  it("connects and closes a Cloudflare worker realtime session", async () => {
    const connectCalls: unknown[] = [];
    let closeCount = 0;

    const worker = createOpenAiAgentsSdkDemoCloudflareWorkerRuntime(
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
              status: "configured",
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
                name: "CloudflareRealtimeTransportLayer",
              },
            },
          }) as const,
      }
    );

    await worker.connect();

    expect(connectCalls).toEqual([
      {
        apiKey: "openai-key",
        model: "gpt-realtime-2",
      },
    ]);
    expect(worker.getState()).toEqual({
      closeCount: 0,
      connectCount: 1,
      isConnected: true,
    });

    worker.close();

    expect(closeCount).toBe(1);
    expect(worker.getState()).toEqual({
      closeCount: 1,
      connectCount: 1,
      isConnected: false,
    });
  });
});
