import { describe, expect, it } from "vitest";

import {
  createOpenAiAgentsSdkDemoCloudflareWorkerApp,
  getOpenAiAgentsSdkDemoCloudflareWorkerAppProfile,
} from "./voice-cloudflare-app";

describe("openai agents sdk demo cloudflare worker app", () => {
  it("exposes the deployed worker-app contract", () => {
    expect(getOpenAiAgentsSdkDemoCloudflareWorkerAppProfile()).toEqual({
      connectRoutePath: "/connect",
      healthcheckMessage: "Cloudflare Realtime Worker is running!",
      openAiApiKeyEnvVar: "OPENAI_API_KEY",
      publicTransportContract: "deployed-worker-fetch-handler",
      rootRoutePath: "/",
      sdkPrimitive: "CloudflareRealtimeTransportLayer + RealtimeSession",
      serverPrimitive: "export default { fetch(request, env, ctx) }",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/extensions/cloudflare/",
      status: "setup-required",
      websocketUpgradePrimitive: "fetch() + Upgrade: websocket",
      workerCompatibilityFlag: "nodejs_compat",
      workflowName: "openai-agents-sdk-demo-voice-cloudflare",
    });
  });

  it("returns a healthcheck response from the root route", async () => {
    const app = createOpenAiAgentsSdkDemoCloudflareWorkerApp();
    const response = await app.handleRequest(
      new Request("https://demo.example/")
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "Cloudflare Realtime Worker is running!",
    });
  });

  it("connects and closes the worker runtime from the connect route", async () => {
    const calls: string[] = [];
    const app = createOpenAiAgentsSdkDemoCloudflareWorkerApp(
      {
        OPENAI_API_KEY: "openai-key",
      },
      {
        createRuntime: () => ({
          close: () => {
            calls.push("close");
          },
          connect: async () => {
            calls.push("connect");
          },
          getState: () => ({
            closeCount: 0,
            connectCount: 1,
            isConnected: true,
          }),
          profile: {
            connectPrimitive: "RealtimeSession.connect({ apiKey, model })",
            openAiApiKeyEnvVar: "OPENAI_API_KEY",
            openEventBehavior: "skipOpenEventListeners: true",
            runtimeEntryPoint: "Cloudflare Worker fetch()",
            sdkPrimitive: "CloudflareRealtimeTransportLayer + RealtimeSession",
            sourceGuide:
              "https://openai.github.io/openai-agents-js/extensions/cloudflare/",
            status: "configured",
            transport: "WebSocket",
            websocketUpgradePrimitive: "fetch() + Upgrade: websocket",
            workerCompatibilityFlag: "nodejs_compat",
            workflowName: "openai-agents-sdk-demo-voice-cloudflare",
          },
          session: {
            close: () => {},
            connect: async () => {},
          },
          transportName: "CloudflareRealtimeTransportLayer",
        }),
      }
    );

    const response = await app.handleRequest(
      new Request("https://demo.example/connect", {
        headers: {
          upgrade: "websocket",
        },
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      state: {
        closeCount: 0,
        connectCount: 1,
        isConnected: true,
      },
      transportName: "CloudflareRealtimeTransportLayer",
      workflowName: "openai-agents-sdk-demo-voice-cloudflare",
    });
    expect(calls).toEqual(["connect", "close"]);
  });
});
