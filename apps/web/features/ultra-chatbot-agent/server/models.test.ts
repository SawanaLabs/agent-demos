import { describe, expect, it } from "vitest";

import {
  getUltraChatbotAgentDefaultModel,
  getUltraChatbotAgentModelCatalog,
  isUltraChatbotAgentModelId,
} from "./models";

describe("ultra chatbot agent model catalog", () => {
  it("pins the curated model set for the ultra chatbot workspace", () => {
    expect(getUltraChatbotAgentModelCatalog().map((model) => model.id)).toEqual(
      [
        "openai/gpt-4.1-mini",
        "openai/gpt-5-mini",
        "deepseek/deepseek-v4-flash",
        "deepseek/deepseek-v4-pro",
      ]
    );
  });

  it("exposes the expected default model", () => {
    expect(getUltraChatbotAgentDefaultModel()).toBe("openai/gpt-4.1-mini");
  });

  it("guards runtime requests against unknown model ids", () => {
    expect(isUltraChatbotAgentModelId("openai/gpt-5-mini")).toBe(true);
    expect(isUltraChatbotAgentModelId("anthropic/claude-sonnet-4")).toBe(
      false
    );
  });
});
