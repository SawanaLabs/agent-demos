import { describe, expect, it } from "vitest";

import {
  DEFAULT_MINIMAL_CHAT_AGENT_MODEL,
  getMinimalChatAgentConfig,
  getMinimalChatAgentSetupState,
} from "./env";

describe("minimal chat agent environment", () => {
  it("uses an OpenAI model by default for provider-native web search", () => {
    expect(
      getMinimalChatAgentConfig({ AI_GATEWAY_API_KEY: "test-key" }).chatModel
    ).toBe(DEFAULT_MINIMAL_CHAT_AGENT_MODEL);
  });

  it("accepts an explicit OpenAI AI Gateway model", () => {
    expect(
      getMinimalChatAgentConfig({
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5",
      }).chatModel
    ).toBe("openai/gpt-5");
  });

  it("fails setup when the selected model cannot expose OpenAI web search", () => {
    const setup = getMinimalChatAgentSetupState({
      AI_GATEWAY_API_KEY: "test-key",
      AI_GATEWAY_CHAT_MODEL: "anthropic/claude-sonnet-4.5",
    });

    expect(setup.isReady).toBe(false);
    expect(setup.issues).toContain(
      "Minimal Chat Agent requires an openai/* AI Gateway model for provider-native web search."
    );
    expect(() =>
      getMinimalChatAgentConfig({
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_CHAT_MODEL: "anthropic/claude-sonnet-4.5",
      })
    ).toThrow(
      "Minimal Chat Agent requires an openai/* AI Gateway model for provider-native web search."
    );
  });
});
