import { describe, expect, it } from "vitest";

import { getLangGraphAgentConfig, getLangGraphAgentSetupState } from "./env";

const apiUrlEnvPattern = /LANGGRAPH_AGENT_API_URL/i;
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
    });
  });

  it("surfaces missing remote LangGraph setup inside the setup state", () => {
    const setup = getLangGraphAgentSetupState({});

    expect(setup.isReady).toBe(false);
    expect(setup.issues.join(" ")).toMatch(apiUrlEnvPattern);
    expect(setup.issues.join(" ")).toMatch(assistantIdEnvPattern);
  });
});
