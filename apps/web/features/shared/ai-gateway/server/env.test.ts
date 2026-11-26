import { describe, expect, it } from "vitest";

import { getAiGatewayConfig, getAiGatewaySetupState } from "./env";

const missingOpenAiKeyPattern = /OPENAI_API_KEY is required/i;

describe("AI Gateway env contract", () => {
  it("reads required and optional values", () => {
    expect(
      getAiGatewayConfig({
        AI_GATEWAY_API_KEY: "test-key",
        OPENAI_API_KEY: "test-openai-key",
        AI_GATEWAY_BASE_URL: "https://gateway.example.com",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-4.1-nano",
      })
    ).toMatchObject({
      apiKey: "test-key",
      baseURL: "https://gateway.example.com",
      chatModel: "openai/gpt-4.1-nano",
    });
  });

  it("defaults to GPT 5.6 Luna", () => {
    expect(
      getAiGatewayConfig({
        OPENAI_API_KEY: "test-openai-key",
        AI_GATEWAY_API_KEY: "test-key",
      }).chatModel
    ).toBe("openai/gpt-5.6-luna");
  });

  it("reports missing credentials clearly", () => {
    expect(getAiGatewaySetupState({}).issues.join(" ")).toMatch(
      missingOpenAiKeyPattern
    );
  });
});
