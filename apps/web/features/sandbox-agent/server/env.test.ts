import { describe, expect, it } from "vitest";
import {
  getSandboxAgentConfig,
  getSandboxAgentSandboxSetupState,
  getSandboxAgentSetupState,
} from "./env";

describe("sandbox agent env", () => {
  it("returns config from the feature-local env contract", () => {
    expect(
      getSandboxAgentConfig({
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_BASE_URL: "https://gateway.example.com/v3/ai",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5",
        VERCEL_OIDC_TOKEN: "oidc-token",
      })
    ).toEqual({
      apiKey: "test-key",
      baseURL: "https://gateway.example.com/v3/ai",
      chatModel: "openai/gpt-5",
    });
  });

  it("surfaces missing gateway and sandbox setup", () => {
    const setup = getSandboxAgentSetupState({});

    expect(setup.isReady).toBe(false);
    expect(setup.issues.join(" ")).toMatch(/AI_GATEWAY_API_KEY/i);
    expect(setup.issues.join(" ")).toMatch(/VERCEL_OIDC_TOKEN/i);
  });

  it("accepts token-based sandbox credentials", () => {
    expect(
      getSandboxAgentSandboxSetupState({
        VERCEL_PROJECT_ID: "project-id",
        VERCEL_TEAM_ID: "team-id",
        VERCEL_TOKEN: "vercel-token",
      })
    ).toMatchObject({
      authMode: "token",
      isReady: true,
      providerLabel: "Vercel Sandbox",
      runtime: "node24",
    });
  });
});
