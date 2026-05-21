import { describe, expect, it } from "vitest";

import { getAiGatewayConfig, getAiGatewaySetupState } from "./env";

const missingGatewayKeyPattern = /AI_GATEWAY_API_KEY is missing/i;

describe("AI Gateway env contract", () => {
  it("reads required and optional values", () => {
    expect(
      getAiGatewayConfig({
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_BASE_URL: "https://gateway.example.com",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-4.1-nano",
      })
    ).toMatchObject({
      apiKey: "test-key",
      baseURL: "https://gateway.example.com",
      chatModel: "openai/gpt-4.1-nano",
    });
  });

  it("reports missing credentials clearly", () => {
    expect(getAiGatewaySetupState({}).issues.join(" ")).toMatch(
      missingGatewayKeyPattern
    );
  });
});
