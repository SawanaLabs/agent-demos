import { describe, expect, it, vi } from "vitest";

import {
  getOpenAiAgentsSdkDemoVoiceClientSecretRouteState,
  handleOpenAiAgentsSdkDemoVoiceClientSecretRequest,
} from "./voice-realtime";

const openAiApiKeyPattern = /OPENAI_API_KEY/i;
const sha256HexPattern = /^[a-f0-9]{64}$/;

describe("openai agents sdk demo voice realtime route", () => {
  it("reports route setup as configured only when OPENAI_API_KEY exists", () => {
    expect(getOpenAiAgentsSdkDemoVoiceClientSecretRouteState()).toEqual({
      openAiApiKeyEnvVar: "OPENAI_API_KEY",
      routePath: "/api/demos/openai-agents-sdk-demo/realtime/client-secrets",
      sessionModel: "gpt-realtime-2",
      sessionVoice: "marin",
      sdkPrimitive: "client.realtime.clientSecrets.create()",
      status: "setup-required",
    });

    expect(
      getOpenAiAgentsSdkDemoVoiceClientSecretRouteState({
        OPENAI_API_KEY: "openai-key",
      })
    ).toMatchObject({
      status: "configured",
    });
  });

  it("requires a native OPENAI_API_KEY before minting a client secret", async () => {
    const response = await handleOpenAiAgentsSdkDemoVoiceClientSecretRequest(
      new Request(
        "http://localhost/api/demos/openai-agents-sdk-demo/realtime/client-secrets",
        {
          method: "POST",
        }
      ),
      {}
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(openAiApiKeyPattern),
    });
  });

  it("mints a client secret with the official realtime session payload", async () => {
    const createClientSecret = vi.fn().mockResolvedValue({
      expires_at: 1_756_310_470,
      session: {
        audio: {
          output: {
            voice: "marin",
          },
        },
        model: "gpt-realtime-2",
        object: "realtime.session",
        type: "realtime",
      },
      value: "ek_test",
    });

    const response = await handleOpenAiAgentsSdkDemoVoiceClientSecretRequest(
      new Request(
        "http://localhost/api/demos/openai-agents-sdk-demo/realtime/client-secrets",
        {
          body: JSON.stringify({ sessionId: "session-123" }),
          method: "POST",
        }
      ),
      {
        OPENAI_API_KEY: "openai-key",
      },
      {
        createClientSecret,
      }
    );

    expect(createClientSecret).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "openai-key",
        params: {
          expires_after: {
            anchor: "created_at",
            seconds: 600,
          },
          session: {
            audio: {
              output: {
                voice: "marin",
              },
            },
            model: "gpt-realtime-2",
            type: "realtime",
          },
        },
        safetyIdentifier: expect.stringMatching(sha256HexPattern),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      expires_at: 1_756_310_470,
      session: {
        audio: {
          output: {
            voice: "marin",
          },
        },
        model: "gpt-realtime-2",
        object: "realtime.session",
        type: "realtime",
      },
      value: "ek_test",
    });
  });
});
