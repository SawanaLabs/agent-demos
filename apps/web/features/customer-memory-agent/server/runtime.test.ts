import { describe, expect, it, vi } from "vitest";

import {
  getCustomerMemoryRuntimeState,
  handleCustomerMemoryChatRequest,
} from "./runtime";

const missingGatewaySetupPattern = /AI_GATEWAY_API_KEY/i;

describe("customer memory runtime", () => {
  it("reports setup requirements when gateway or database config is missing", () => {
    expect(getCustomerMemoryRuntimeState({})).toMatchObject({
      compactionThreshold: 20,
      isChatAvailable: false,
      setupMessage: expect.stringMatching(missingGatewaySetupPattern),
      statusLabel: "Setup required",
    });
  });

  it("reports ready when gateway and database config are present", () => {
    expect(
      getCustomerMemoryRuntimeState({
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      })
    ).toMatchObject({
      chatModel: expect.any(String),
      compactionThreshold: 20,
      isChatAvailable: true,
      setupMessage: null,
      statusLabel: "Ready",
    });
  });

  it("validates and forwards a chat request into the customer-memory conversation streamer", async () => {
    const streamCustomerMemoryConversation = vi
      .fn()
      .mockResolvedValue(Response.json({ ok: true }));

    const response = await handleCustomerMemoryChatRequest(
      new Request("http://localhost/api/demos/customer-memory-agent", {
        body: JSON.stringify({
          customerId: "demo-sandbox",
          messages: [
            {
              id: "user-1",
              parts: [
                { text: "Remember our plain-text email policy.", type: "text" },
              ],
              role: "user",
            },
          ],
          threadId: "thread-1",
        }),
        method: "POST",
      }),
      {
        isReadonly: false,
        visitorId: "visitor-123",
      },
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      },
      {
        ensureThreadOwnership: vi.fn().mockResolvedValue(undefined),
        streamCustomerMemoryConversation,
      }
    );

    expect(response.status).toBe(200);
    expect(streamCustomerMemoryConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: expect.objectContaining({ id: "demo-sandbox" }),
        threadId: "thread-1",
        visitorId: "visitor-123",
      }),
      expect.objectContaining({
        AI_GATEWAY_API_KEY: "test-key",
      })
    );
  });

  it("rejects malformed json with a client error", async () => {
    const response = await handleCustomerMemoryChatRequest(
      new Request("http://localhost/api/demos/customer-memory-agent", {
        body: '{"customerId":',
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      }),
      {
        isReadonly: false,
        visitorId: "visitor-123",
      },
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Expected a valid JSON request body.",
    });
  });

  it("rejects unknown or missing thread ownership with a not-found error", async () => {
    const response = await handleCustomerMemoryChatRequest(
      new Request("http://localhost/api/demos/customer-memory-agent", {
        body: JSON.stringify({
          customerId: "demo-sandbox",
          messages: [
            {
              id: "user-1",
              parts: [{ text: "hello", type: "text" }],
              role: "user",
            },
          ],
          threadId: "thread-404",
        }),
        method: "POST",
      }),
      {
        isReadonly: false,
        visitorId: "demo-shared",
      },
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      },
      {
        ensureThreadOwnership: vi
          .fn()
          .mockRejectedValue(
            new Error(
              "No customer-memory thread found for thread-404 under demo-sandbox."
            )
          ),
        streamCustomerMemoryConversation: vi.fn(),
      }
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error:
        "No customer-memory thread found for thread-404 under demo-sandbox.",
    });
  });

  it("rejects writes against shared readonly demo accounts", async () => {
    const response = await handleCustomerMemoryChatRequest(
      new Request("http://localhost/api/demos/customer-memory-agent", {
        body: JSON.stringify({
          customerId: "acme-co",
          messages: [
            {
              id: "user-1",
              parts: [
                { text: "Can you draft a new status update?", type: "text" },
              ],
              role: "user",
            },
          ],
          threadId: "thread-1",
        }),
        method: "POST",
      }),
      {
        isReadonly: false,
        visitorId: "visitor-123",
      },
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      },
      {
        streamCustomerMemoryConversation: vi.fn(),
      }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error:
        'Customer-memory demo account "Acme Co" is read-only. Switch to Demo Sandbox to create your own threads.',
    });
  });
});
