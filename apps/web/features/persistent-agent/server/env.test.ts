import { describe, expect, it } from "vitest";
import {
  getPersistentAgentConfig,
  getPersistentAgentSetupState,
} from "./env";

describe("persistent agent env", () => {
  it("returns config from the feature-local env contract", () => {
    expect(
      getPersistentAgentConfig({
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_BASE_URL: "https://gateway.example.com/v3/ai",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
        REDIS_URL: "redis://localhost:6379",
      })
    ).toEqual({
      apiKey: "test-key",
      baseURL: "https://gateway.example.com/v3/ai",
      chatModel: "openai/gpt-5",
      databaseUrl: "postgresql://user:password@localhost:5432/database",
      redisUrl: "redis://localhost:6379",
    });
  });

  it("surfaces missing gateway, database, and redis setup", () => {
    const setup = getPersistentAgentSetupState({});

    expect(setup.isReady).toBe(false);
    expect(setup.issues.join(" ")).toMatch(/AI_GATEWAY_API_KEY/i);
    expect(setup.issues.join(" ")).toMatch(/DATABASE_URL/i);
    expect(setup.issues.join(" ")).toMatch(/REDIS_URL/i);
  });
});
