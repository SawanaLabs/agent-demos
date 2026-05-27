import { describe, expect, it } from "vitest";
import {
  getTraceEvalAgentConfig,
  getTraceEvalAgentSetupState,
} from "./env";

describe("trace eval agent env", () => {
  it("returns chat config from the feature-local env contract", () => {
    expect(
      getTraceEvalAgentConfig({
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_BASE_URL: "https://gateway.example.com/v3/ai",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5",
      })
    ).toEqual({
      apiKey: "test-key",
      baseURL: "https://gateway.example.com/v3/ai",
      chatModel: "openai/gpt-5",
    });
  });

  it("surfaces missing gateway setup inside the setup state", () => {
    const setup = getTraceEvalAgentSetupState({});

    expect(setup.isReady).toBe(false);
    expect(setup.issues.join(" ")).toMatch(/AI_GATEWAY_API_KEY/i);
  });
});
