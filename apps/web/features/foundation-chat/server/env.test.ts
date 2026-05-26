import { describe, expect, it } from "vitest";

import {
  getFoundationChatConfig,
  getFoundationChatSetupState,
} from "./env";

describe("foundation chat env", () => {
  it("resolves the feature-local AI Gateway config with defaults", () => {
    expect(
      getFoundationChatConfig({
        AI_GATEWAY_API_KEY: "test-key",
      })
    ).toEqual({
      apiKey: "test-key",
      baseURL: "https://ai-gateway.vercel.sh/v3/ai",
      chatModel: "openai/gpt-4.1-mini",
    });
  });

  it("surfaces setup-required state through the feature-local contract", () => {
    expect(getFoundationChatSetupState({})).toMatchObject({
      config: {
        baseURL: "https://ai-gateway.vercel.sh/v3/ai",
        chatModel: "openai/gpt-4.1-mini",
      },
      isReady: false,
      issues: [
        "AI_GATEWAY_API_KEY is missing. The demo can render, but chat requests will fail until it is configured.",
      ],
      nodeVersion: process.version,
    });
  });
});
