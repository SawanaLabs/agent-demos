import { describe, expect, it } from "vitest";

import {
  createOpenAiAgentsSdkDemoCloudflareWorkerModule,
  getOpenAiAgentsSdkDemoCloudflareWorkerModuleProfile,
} from "./voice-cloudflare-worker-module";

describe("openai agents sdk demo cloudflare worker module", () => {
  it("exposes the deployable worker-module contract", () => {
    expect(getOpenAiAgentsSdkDemoCloudflareWorkerModuleProfile()).toEqual({
      modulePrimitive: "export default { fetch(request, env, ctx) }",
      openAiApiKeyEnvVar: "OPENAI_API_KEY",
      runtimeContract: "cloudflare-worker-module",
      sdkPrimitive: "CloudflareRealtimeTransportLayer + RealtimeSession",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/extensions/cloudflare/",
      status: "setup-required",
      workflowName: "openai-agents-sdk-demo-voice-cloudflare",
    });
  });

  it("delegates fetch requests to the worker app handler", async () => {
    const module = createOpenAiAgentsSdkDemoCloudflareWorkerModule(
      {
        OPENAI_API_KEY: "openai-key",
      },
      {
        createApp: () => ({
          handleRequest: async (request: Request) =>
            Response.json({
              method: request.method,
              pathname: new URL(request.url).pathname,
            }),
          profile: {
            connectRoutePath: "/connect",
            healthcheckMessage: "Cloudflare Realtime Worker is running!",
            openAiApiKeyEnvVar: "OPENAI_API_KEY",
            publicTransportContract: "deployed-worker-fetch-handler",
            rootRoutePath: "/",
            sdkPrimitive: "CloudflareRealtimeTransportLayer + RealtimeSession",
            serverPrimitive: "export default { fetch(request, env, ctx) }",
            sourceGuide:
              "https://openai.github.io/openai-agents-js/extensions/cloudflare/",
            status: "configured",
            websocketUpgradePrimitive: "fetch() + Upgrade: websocket",
            workerCompatibilityFlag: "nodejs_compat",
            workflowName: "openai-agents-sdk-demo-voice-cloudflare",
          },
        }),
      }
    );

    const response = await module.fetch(
      new Request("https://demo.example/connect", {
        method: "POST",
      }),
      {},
      {}
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      method: "POST",
      pathname: "/connect",
    });
  });
});
