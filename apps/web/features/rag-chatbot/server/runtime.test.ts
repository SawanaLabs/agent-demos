import { describe, expect, it } from "vitest";

import type { RagKnowledgeBaseStatus } from "./knowledge-base-status";
import { getRagChatbotRuntimeState, handleRagChatbotRequest } from "./runtime";

const missingDatabasePattern = /DATABASE_URL/i;
const missingGatewayKeyPattern = /AI_GATEWAY_API_KEY/i;

function createKnowledgeBaseStatus(
  overrides: Partial<RagKnowledgeBaseStatus>
): RagKnowledgeBaseStatus {
  return {
    indexedResourceCount: 1,
    isReady: true,
    message: null,
    statusLabel: "Ready",
    ...overrides,
  };
}

describe("rag chatbot runtime", () => {
  it("reports setup requirements before chat work starts", async () => {
    const state = await getRagChatbotRuntimeState({});

    expect(state).toMatchObject({
      isChatAvailable: false,
      statusLabel: "Setup required",
      setupMessage: expect.stringMatching(missingGatewayKeyPattern),
    });
  });

  it("reports index required when the source PDF has not been indexed yet", async () => {
    await expect(
      getRagChatbotRuntimeState(
        {
          AI_GATEWAY_API_KEY: "test-key",
          DATABASE_URL: "postgresql://user:password@localhost:5432/database",
        },
        {
          getKnowledgeBaseStatus: async () =>
            createKnowledgeBaseStatus({
              indexedResourceCount: 0,
              isReady: false,
              message: "index required",
              statusLabel: "Index required",
            }),
        }
      )
    ).resolves.toMatchObject({
      isChatAvailable: false,
      setupMessage: expect.stringMatching(/index/i),
      statusLabel: "Index required",
    });
  });

  it("accepts the configured preindexed NASA guide as the source document", async () => {
    await expect(
      getRagChatbotRuntimeState(
        {
          AI_GATEWAY_API_KEY: "test-key",
          DATABASE_URL: "postgresql://user:password@localhost:5432/database",
        },
        {
          getKnowledgeBaseStatus: async () => createKnowledgeBaseStatus({}),
        }
      )
    ).resolves.toMatchObject({
      isChatAvailable: true,
      sourceDocument: {
        title: "NASA Graphics Standards Manual",
      },
      statusLabel: "Ready",
    });
  });

  it("returns an index error before attempting retrieval", async () => {
    const response = await handleRagChatbotRequest(
      new Request("http://localhost/api/demos/rag-chatbot", {
        body: JSON.stringify({ messages: [] }),
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      },
      {
        getKnowledgeBaseStatus: async () =>
          createKnowledgeBaseStatus({
            indexedResourceCount: 0,
            isReady: false,
            message: "index required",
            statusLabel: "Index required",
          }),
        streamRagChatbot: async () => Response.json({ ok: true }),
      }
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(/index/i),
    });
  });

  it("returns a setup error before attempting retrieval", async () => {
    const response = await handleRagChatbotRequest(
      new Request("http://localhost/api/demos/rag-chatbot", {
        body: JSON.stringify({ messages: [] }),
        method: "POST",
      }),
      {}
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(missingGatewayKeyPattern),
    });
  });

  it("returns a database setup error when gateway setup is present but pgvector is unavailable", async () => {
    const response = await handleRagChatbotRequest(
      new Request("http://localhost/api/demos/rag-chatbot", {
        body: JSON.stringify({ messages: [] }),
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
      },
      {
        getKnowledgeBaseStatus: async () =>
          createKnowledgeBaseStatus({
            indexedResourceCount: 0,
            isReady: false,
            message:
              "DATABASE_URL is missing. The RAG chatbot can render, but chat requests require a preindexed pgvector database.",
            statusLabel: "Setup required",
          }),
        streamRagChatbot: async () => Response.json({ ok: true }),
      }
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      error: expect.stringMatching(missingDatabasePattern),
    });
  });

  it("rejects invalid request bodies before retrieval", async () => {
    const response = await handleRagChatbotRequest(
      new Request("http://localhost/api/demos/rag-chatbot", {
        body: JSON.stringify({ prompt: "hello" }),
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      },
      {
        getKnowledgeBaseStatus: async () => createKnowledgeBaseStatus({}),
        streamRagChatbot: async () => Response.json({ ok: true }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Expected a JSON body with a "messages" array.',
    });
  });

  it("rejects malformed JSON request bodies with a client error", async () => {
    const response = await handleRagChatbotRequest(
      new Request("http://localhost/api/demos/rag-chatbot", {
        body: '{"messages":',
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      },
      {
        getKnowledgeBaseStatus: async () => createKnowledgeBaseStatus({}),
        streamRagChatbot: async () => Response.json({ ok: true }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Expected a valid JSON request body.",
    });
  });

  it("rejects invalid UIMessage entries before chat streaming starts", async () => {
    const response = await handleRagChatbotRequest(
      new Request("http://localhost/api/demos/rag-chatbot", {
        body: JSON.stringify({
          messages: [{}],
        }),
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      },
      {
        getKnowledgeBaseStatus: async () => createKnowledgeBaseStatus({}),
        streamRagChatbot: async () => Response.json({ ok: true }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Expected each "messages" entry to match the UIMessage format.',
    });
  });

  it("streams valid chat requests through the RAG streamer", async () => {
    const response = await handleRagChatbotRequest(
      new Request("http://localhost/api/demos/rag-chatbot", {
        body: JSON.stringify({
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [{ type: "text", text: "What is the NASA logotype?" }],
            },
          ],
        }),
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      },
      {
        getKnowledgeBaseStatus: async () => createKnowledgeBaseStatus({}),
        streamRagChatbot: async (messages) =>
          Response.json({ messageCount: messages.length }),
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ messageCount: 1 });
  });
});
