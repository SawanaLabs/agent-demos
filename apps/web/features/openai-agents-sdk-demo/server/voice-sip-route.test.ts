import { describe, expect, it, vi } from "vitest";

import {
  getOpenAiAgentsSdkDemoSipRouteState,
  handleOpenAiAgentsSdkDemoSipRequest,
} from "./voice-sip-route";

describe("openai agents sdk demo SIP route", () => {
  it("reports route setup as configured only when OPENAI_API_KEY exists", () => {
    expect(getOpenAiAgentsSdkDemoSipRouteState()).toEqual({
      openAiApiKeyEnvVar: "OPENAI_API_KEY",
      routePath: "/api/demos/openai-agents-sdk-demo/realtime/sip",
      sdkPrimitive: "OpenAIRealtimeSIP.buildInitialConfig()",
      status: "setup-required",
    });

    expect(
      getOpenAiAgentsSdkDemoSipRouteState({
        OPENAI_API_KEY: "openai-key",
      })
    ).toMatchObject({
      status: "configured",
    });
  });

  it("requires a native OPENAI_API_KEY before building the SIP accept payload", async () => {
    const response = await handleOpenAiAgentsSdkDemoSipRequest(
      new Request("http://localhost/api/demos/openai-agents-sdk-demo/realtime/sip", {
        body: JSON.stringify({
          callId: "call_123",
        }),
        method: "POST",
      }),
      {}
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/OPENAI_API_KEY/i),
    });
  });

  it("returns a SIP accept payload built from the official helper", async () => {
    const buildInitialConfig = vi.fn().mockResolvedValue({
      audio: {
        output: {
          voice: "marin",
        },
      },
      instructions: "voice-agent",
      type: "realtime",
    });

    const response = await handleOpenAiAgentsSdkDemoSipRequest(
      new Request("http://localhost/api/demos/openai-agents-sdk-demo/realtime/sip", {
        body: JSON.stringify({
          callId: "call_123",
        }),
        method: "POST",
      }),
      {
        OPENAI_API_KEY: "openai-key",
      },
      {
        buildInitialConfig,
      }
    );

    expect(buildInitialConfig).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      acceptPayload: {
        audio: {
          output: {
            voice: "marin",
          },
        },
        instructions: "voice-agent",
        type: "realtime",
      },
      callId: "call_123",
    });
  });

  it("returns a 400 when the request body is missing a callId", async () => {
    const response = await handleOpenAiAgentsSdkDemoSipRequest(
      new Request("http://localhost/api/demos/openai-agents-sdk-demo/realtime/sip", {
        body: JSON.stringify({}),
        method: "POST",
      }),
      {
        OPENAI_API_KEY: "openai-key",
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/callId/i),
    });
  });
});
