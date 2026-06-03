import { describe, expect, it } from "vitest";

import { getLangGraphAgentConfig, getLangGraphAgentSetupState } from "./env";

const apiUrlEnvPattern = /LANGGRAPH_AGENT_API_URL/i;
const apiKeyEnvPattern = /LANGGRAPH_AGENT_API_KEY/i;
const assistantIdEnvPattern = /LANGGRAPH_AGENT_ASSISTANT_ID/i;

describe("langgraph agent env", () => {
  it("returns remote LangGraph config from the feature env contract", () => {
    expect(
      getLangGraphAgentConfig({
        LANGGRAPH_AGENT_API_KEY: "test-key",
        LANGGRAPH_AGENT_API_URL: "http://localhost:2024",
        LANGGRAPH_AGENT_ASSISTANT_ID: "agent",
      })
    ).toEqual({
      apiKey: "test-key",
      assistantId: "agent",
      baseUrl: "http://localhost:2024",
      modelName: "openai/gpt-5-mini",
    });
  });

  it("uses the LangGraph model override when provided", () => {
    expect(
      getLangGraphAgentConfig({
        LANGGRAPH_AGENT_API_KEY: "test-key",
        LANGGRAPH_AGENT_API_URL: "http://localhost:2024",
        LANGGRAPH_AGENT_ASSISTANT_ID: "agent",
        LANGGRAPH_AGENT_MODEL: "openai/gpt-5",
      })
    ).toEqual({
      apiKey: "test-key",
      assistantId: "agent",
      baseUrl: "http://localhost:2024",
      modelName: "openai/gpt-5",
    });
  });

  it("requires the shared LangGraph service key in the feature config", () => {
    expect(() =>
      getLangGraphAgentConfig({
        LANGGRAPH_AGENT_API_URL: "http://localhost:2024",
        LANGGRAPH_AGENT_ASSISTANT_ID: "agent",
      })
    ).toThrow(apiKeyEnvPattern);
  });

  it("surfaces missing remote LangGraph setup inside the setup state", () => {
    const setup = getLangGraphAgentSetupState({});

    expect(setup.isReady).toBe(false);
    expect(setup.issues.join(" ")).toMatch(apiUrlEnvPattern);
    expect(setup.issues.join(" ")).toMatch(apiKeyEnvPattern);
    expect(setup.issues.join(" ")).toMatch(assistantIdEnvPattern);
  });
});
