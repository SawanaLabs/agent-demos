import { describe, expect, it } from "vitest";

import {
  DEFAULT_IMAGE_WORKFLOW_AGENT_IMAGE_MODEL,
  getImageWorkflowAgentSetupState,
  readImageWorkflowAgentConfig,
} from "./env";

describe("image workflow agent env", () => {
  it("does not crash startup when credentials are missing", () => {
    expect(getImageWorkflowAgentSetupState({})).toEqual({
      config: {
        baseURL: "https://ai-gateway.vercel.sh/v3/ai",
        chatModel: "openai/gpt-5.6-luna",
        imageModel: DEFAULT_IMAGE_WORKFLOW_AGENT_IMAGE_MODEL,
      },
      isReady: false,
      issues: [
        "OPENAI_API_KEY is required for OpenAI Platform.",
        "Missing AI gateway credentials. Set AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN before using the image workflow agent.",
      ],
      nodeVersion: process.version,
    });
  });

  it("reads config from API key and explicit models", () => {
    expect(
      readImageWorkflowAgentConfig({
        AI_GATEWAY_API_KEY: "test-key",
        OPENAI_API_KEY: "test-openai-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5-mini",
        AI_GATEWAY_IMAGE_MODEL: "google/gemini-3.1-flash-lite-image",
      })
    ).toMatchObject({
      apiKey: "test-key",
      chatModel: "openai/gpt-5-mini",
      imageModel: "google/gemini-3.1-flash-lite-image",
      oidcToken: null,
    });
  });

  it("accepts Vercel OIDC for the Gemini image stage", () => {
    expect(
      readImageWorkflowAgentConfig(
        {
          VERCEL_OIDC_TOKEN: "oidc-token",
        },
        "image"
      )
    ).toMatchObject({
      apiKey: null,
      oidcToken: "oidc-token",
    });
  });

  it("checks the selected model for each stage with only the Platform key", () => {
    const env = { OPENAI_API_KEY: "test-openai-key" };

    expect(readImageWorkflowAgentConfig(env, "chat").chatModel).toMatch(
      /^openai\//
    );
    expect(() => readImageWorkflowAgentConfig(env, "image")).toThrow(
      /gateway credentials/
    );
    expect(
      getImageWorkflowAgentSetupState({
        ...env,
        AI_GATEWAY_IMAGE_MODEL: "openai/gpt-image-2",
      }).isReady
    ).toBe(true);
  });

  it("throws an explicit credential error when runtime config is required", () => {
    expect(() =>
      readImageWorkflowAgentConfig({ AI_GATEWAY_API_KEY: "gateway-key" })
    ).toThrowError("OPENAI_API_KEY is required for OpenAI Platform.");
  });
});
