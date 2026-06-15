import { describe, expect, it } from "vitest";

import { getGenerativeUiConfig, getGenerativeUiSetupState } from "./env";
import { resolveGenerativeUiChatModel } from "./model";

describe("generative UI env", () => {
  it("keeps the feature default model ahead of the global gateway fallback", () => {
    expect(
      getGenerativeUiConfig({
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-4.1-mini",
      })
    ).toEqual({
      apiKey: "test-key",
      baseURL: "https://ai-gateway.vercel.sh/v3/ai",
      chatModel: "openai/gpt-5-mini",
    });
  });

  it("allows a generative UI specific model override", () => {
    expect(
      getGenerativeUiConfig({
        AI_GATEWAY_API_KEY: "test-key",
        GENERATIVE_UI_CHAT_MODEL: "openai/gpt-5",
      }).chatModel
    ).toBe("openai/gpt-5");
  });

  it("uses the same model precedence in setup state and runtime metadata", () => {
    expect(
      getGenerativeUiSetupState({
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-4.1-mini",
      }).config.chatModel
    ).toBe("openai/gpt-5-mini");
    expect(
      resolveGenerativeUiChatModel({
        GENERATIVE_UI_CHAT_MODEL: "openai/gpt-5",
      })
    ).toBe("openai/gpt-5");
  });

  it("surfaces missing gateway setup inside the setup state", () => {
    const setup = getGenerativeUiSetupState({});

    expect(setup.isReady).toBe(false);
    expect(setup.issues.join(" ")).toMatch(/AI_GATEWAY_API_KEY/i);
  });
});
