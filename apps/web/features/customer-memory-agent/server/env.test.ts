import { describe, expect, it } from "vitest";

import {
  getCustomerMemoryAgentConfig,
  getCustomerMemoryAgentDatabaseConfig,
  getCustomerMemoryAgentSetupState,
} from "./env";

describe("customer memory agent env", () => {
  it("returns config from the feature-local env contract", () => {
    expect(
      getCustomerMemoryAgentConfig({
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_BASE_URL: "https://gateway.example.com/v3/ai",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-4.1",
        DATABASE_URL: "postgres://demo:demo@localhost:5432/demo",
      })
    ).toEqual({
      apiKey: "test-key",
      baseURL: "https://gateway.example.com/v3/ai",
      chatModel: "openai/gpt-4.1",
      databaseUrl: "postgres://demo:demo@localhost:5432/demo",
    });
  });

  it("surfaces missing gateway and database setup through the setup state", () => {
    const setup = getCustomerMemoryAgentSetupState({});

    expect(setup.isReady).toBe(false);
    expect(setup.issues.join(" ")).toMatch(/AI_GATEWAY_API_KEY/i);
    expect(setup.issues.join(" ")).toMatch(/DATABASE_URL/i);
  });

  it("throws when the database contract is missing", () => {
    expect(() => getCustomerMemoryAgentDatabaseConfig({})).toThrow(
      /DATABASE_URL/
    );
  });
});
