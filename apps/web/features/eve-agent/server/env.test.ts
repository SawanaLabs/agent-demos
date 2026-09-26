import { describe, expect, it } from "vitest";

import {
  DEFAULT_EVE_AGENT_CHAT_MODEL,
  getEveAgentConfig,
  getEveAgentSetupState,
} from "./env";

const readyEveSupport = () =>
  Promise.resolve({ module: {}, status: "ready" as const });

describe("eve agent environment", () => {
  it("uses the default AI Gateway chat model", () => {
    expect(
      getEveAgentConfig({ AI_GATEWAY_API_KEY: "test-key" }).chatModel
    ).toBe(DEFAULT_EVE_AGENT_CHAT_MODEL);
  });

  it("requires a gateway key for the run config", () => {
    expect(() => getEveAgentConfig({})).toThrow(/AI_GATEWAY_API_KEY/);
  });

  it("is not ready until the gateway key and eve package both resolve", async () => {
    const setup = await getEveAgentSetupState({});

    expect(setup.isReady).toBe(false);
    expect(setup.issues.join(" ")).toMatch(/AI_GATEWAY_API_KEY/);
    expect(setup.issues.length).toBeGreaterThan(1);
  });

  it("is ready once the eve module resolves and the gateway is configured", async () => {
    const setup = await getEveAgentSetupState(
      { AI_GATEWAY_API_KEY: "test-key" },
      readyEveSupport
    );

    expect(setup).toMatchObject({
      eveStatus: "ready",
      isReady: true,
      issues: [],
    });
  });
});
