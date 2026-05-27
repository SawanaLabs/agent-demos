import { describe, expect, it } from "vitest";
import {
  getObjectGenerationConfig,
  getObjectGenerationSetupState,
} from "./env";

describe("content review env", () => {
  it("returns config from the feature-local env contract", () => {
    expect(
      getObjectGenerationConfig({
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_BASE_URL: "https://gateway.example.com/v3/ai",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-4.1",
      })
    ).toEqual({
      apiKey: "test-key",
      baseURL: "https://gateway.example.com/v3/ai",
      chatModel: "openai/gpt-4.1",
    });
  });

  it("surfaces missing gateway setup through the setup state", () => {
    const setup = getObjectGenerationSetupState({});

    expect(setup.isReady).toBe(false);
    expect(setup.issues.join(" ")).toMatch(/AI_GATEWAY_API_KEY/i);
  });
});
