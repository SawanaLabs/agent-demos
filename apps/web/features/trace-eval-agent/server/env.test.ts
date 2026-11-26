import { afterEach, describe, expect, it, vi } from "vitest";
import { getTraceEvalAgentConfig, getTraceEvalAgentSetupState } from "./env";
import { resolveTraceEvalAgentChatModel } from "./model";

describe("trace eval agent env", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reads the Platform credential through the default app environment", () => {
    vi.stubEnv("OPENAI_API_KEY", "platform-credential-fixture");

    expect(getTraceEvalAgentSetupState().isReady).toBe(true);
    expect(getTraceEvalAgentConfig().chatModel).toBe("openai/gpt-5-mini");
  });

  it("keeps the feature default model ahead of the global gateway fallback", () => {
    expect(
      getTraceEvalAgentConfig({
        AI_GATEWAY_API_KEY: "test-key",
        OPENAI_API_KEY: "test-openai-key",
        AI_GATEWAY_BASE_URL: "https://gateway.example.com/v3/ai",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-4.1-mini",
      })
    ).toEqual({
      apiKey: "test-key",
      baseURL: "https://gateway.example.com/v3/ai",
      chatModel: "openai/gpt-5-mini",
    });
  });

  it("allows a trace-eval-specific model override", () => {
    expect(
      getTraceEvalAgentConfig({
        AI_GATEWAY_API_KEY: "test-key",
        OPENAI_API_KEY: "test-openai-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-4.1-mini",
        TRACE_EVAL_AGENT_CHAT_MODEL: "openai/gpt-5",
      }).chatModel
    ).toBe("openai/gpt-5");
  });

  it("uses the feature model precedence in setup-state config", () => {
    expect(
      getTraceEvalAgentSetupState({
        AI_GATEWAY_API_KEY: "test-key",
        OPENAI_API_KEY: "test-openai-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-4.1-mini",
      }).config.chatModel
    ).toBe("openai/gpt-5-mini");
  });

  it("uses the same model precedence for runtime metadata", () => {
    expect(
      resolveTraceEvalAgentChatModel({
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-4.1-mini",
      })
    ).toBe("openai/gpt-5-mini");
    expect(
      resolveTraceEvalAgentChatModel({
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-4.1-mini",
        TRACE_EVAL_AGENT_CHAT_MODEL: "openai/gpt-5",
      })
    ).toBe("openai/gpt-5");
  });

  it("surfaces missing gateway setup inside the setup state", () => {
    const setup = getTraceEvalAgentSetupState({});

    expect(setup.isReady).toBe(false);
    expect(setup.issues.join(" ")).toMatch(/OPENAI_API_KEY/i);
  });
});
