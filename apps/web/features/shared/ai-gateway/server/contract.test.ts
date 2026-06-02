import { describe, expect, it, vi } from "vitest";

import {
  buildAiGatewayContractSetupState,
  createAiGatewayFromContract,
  DEFAULT_GATEWAY_BASE_URL,
  readAiGatewayContractConfig,
} from "./contract";
import { DEFAULT_CHAT_MODEL } from "./keys";

vi.mock("ai", () => ({
  createGateway: vi.fn((config) => ({ config })),
}));

const contractOptions = {
  defaultChatModel: DEFAULT_CHAT_MODEL,
  missingApiKeyError:
    "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using the test demo.",
  missingApiKeyIssue:
    "AI_GATEWAY_API_KEY is missing. The demo can render, but test requests will fail until it is configured.",
} as const;

describe("AI Gateway runtime contract", () => {
  it("reads gateway config with defaults", () => {
    expect(
      readAiGatewayContractConfig(
        { AI_GATEWAY_API_KEY: "test-key" },
        contractOptions
      )
    ).toEqual({
      apiKey: "test-key",
      baseURL: DEFAULT_GATEWAY_BASE_URL,
      chatModel: DEFAULT_CHAT_MODEL,
    });
  });

  it("throws the caller-owned setup error when the key is missing", () => {
    expect(() => readAiGatewayContractConfig({}, contractOptions)).toThrowError(
      "Missing AI_GATEWAY_API_KEY. Add it to .env.local before using the test demo."
    );
  });

  it("builds setup state with demo-specific config and issues", () => {
    const setup = buildAiGatewayContractSetupState(
      {
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5-mini",
        DATABASE_URL: "",
      },
      {
        ...contractOptions,
        buildConfig: (resolved) => ({
          baseURL: resolved.baseURL,
          chatModel: resolved.chatModel,
          embeddingModel: "openai/text-embedding-3-small",
        }),
        getAdditionalIssues: (_resolved, env) =>
          env.DATABASE_URL
            ? []
            : ["DATABASE_URL is missing. The test demo needs Postgres."],
      }
    );

    expect(setup).toMatchObject({
      config: {
        baseURL: DEFAULT_GATEWAY_BASE_URL,
        chatModel: "openai/gpt-5-mini",
        embeddingModel: "openai/text-embedding-3-small",
      },
      isReady: false,
      issues: ["DATABASE_URL is missing. The test demo needs Postgres."],
    });
  });

  it("creates an AI Gateway provider from the resolved config", () => {
    expect(
      createAiGatewayFromContract(
        {
          AI_GATEWAY_API_KEY: "test-key",
          AI_GATEWAY_BASE_URL: "https://gateway.example.com",
        },
        contractOptions
      )
    ).toEqual({
      config: {
        apiKey: "test-key",
        baseURL: "https://gateway.example.com",
      },
    });
  });
});
