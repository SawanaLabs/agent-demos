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
        chatModel: "openai/gpt-4.1-mini",
        imageModel: DEFAULT_IMAGE_WORKFLOW_AGENT_IMAGE_MODEL,
      },
      isReady: false,
      issues: [
        "AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN is missing. The demo can render, but workflow runs will fail until credentials are configured.",
      ],
      nodeVersion: process.version,
    });
  });

  it("reads config from API key and explicit models", () => {
    expect(
      readImageWorkflowAgentConfig({
        AI_GATEWAY_API_KEY: "test-key",
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

  it("accepts Vercel OIDC without an API key", () => {
    expect(
      readImageWorkflowAgentConfig({
        VERCEL_OIDC_TOKEN: "oidc-token",
      })
    ).toMatchObject({
      apiKey: null,
      oidcToken: "oidc-token",
    });
  });

  it("throws an explicit credential error when runtime config is required", () => {
    expect(() => readImageWorkflowAgentConfig({})).toThrowError(
      "Missing AI gateway credentials. Set AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN before using the image workflow agent."
    );
  });
});
