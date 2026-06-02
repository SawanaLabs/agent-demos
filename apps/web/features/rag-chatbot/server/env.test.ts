import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getRagChatbotConfig,
  getRagChatbotIndexSetupIssue,
  getRagChatbotSetupState,
} from "./env";

describe("rag chatbot env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports gateway setup issues without requiring database access", () => {
    expect(getRagChatbotSetupState({})).toMatchObject({
      isReady: false,
      issues: expect.arrayContaining([
        expect.stringMatching(/AI_GATEWAY_API_KEY/i),
      ]),
    });
  });

  it("uses explicit defaults for the chat and embedding models", () => {
    expect(
      getRagChatbotConfig({
        AI_GATEWAY_API_KEY: "test-key",
      })
    ).toMatchObject({
      baseURL: "https://ai-gateway.vercel.sh/v3/ai",
      chatModel: "openai/gpt-4.1-mini",
      embeddingModel: "openai/text-embedding-3-small",
    });
  });

  it("reads the embedding model from the app env contract", () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
    vi.stubEnv("AI_GATEWAY_EMBEDDING_MODEL", "openai/text-embedding-3-large");

    expect(getRagChatbotSetupState().config.embeddingModel).toBe(
      "openai/text-embedding-3-large"
    );
  });

  it("reports the index setup issue in dependency order", () => {
    expect(getRagChatbotIndexSetupIssue({})).toMatch(/AI_GATEWAY_API_KEY/i);
    expect(
      getRagChatbotIndexSetupIssue({
        AI_GATEWAY_API_KEY: "test-key",
      })
    ).toMatch(/DATABASE_URL/i);
    expect(
      getRagChatbotIndexSetupIssue({
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      })
    ).toBeNull();
  });
});
