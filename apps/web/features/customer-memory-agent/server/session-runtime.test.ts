import { describe, expect, it, vi } from "vitest";

import {
  handleCustomerMemorySessionRequest,
  handleCustomerMemoryThreadCreateRequest,
} from "./session-runtime";

describe("customer memory session runtime", () => {
  it("loads a customer-memory session snapshot from query params", async () => {
    const response = await handleCustomerMemorySessionRequest(
      new Request(
        "http://localhost/api/demos/customer-memory-agent/session?customerId=acme-co&threadId=thread-1&query=plain-text"
      ),
      {
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      },
      {
        loadCustomerMemorySession: vi.fn().mockResolvedValue({
          customer: { id: "acme-co", name: "Acme Co" },
          latestCompaction: null,
          memoryEvents: [],
          memories: [],
          messages: [],
          relevantMemories: [],
          thread: {
            createdAt: "2026-05-23T00:00:01.000Z",
            customerId: "acme-co",
            id: "thread-1",
            title: "Acme memory thread",
            updatedAt: "2026-05-23T00:00:01.000Z",
          },
          threads: [],
        }),
      },
      {
        isReadonly: false,
        visitorId: "demo-shared",
      }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      customer: { id: "acme-co", name: "Acme Co" },
      thread: { id: "thread-1" },
    });
  });

  it("creates a new thread and returns the hydrated session snapshot", async () => {
    const response = await handleCustomerMemoryThreadCreateRequest(
      new Request("http://localhost/api/demos/customer-memory-agent/session", {
        body: JSON.stringify({
          customerId: "demo-sandbox",
        }),
        method: "POST",
      }),
      {
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      },
      {
        createCustomerMemoryThread: vi.fn().mockResolvedValue({
          customer: { id: "demo-sandbox" },
          thread: { id: "thread-2" },
        }),
        loadCustomerMemorySession: vi.fn().mockResolvedValue({
          customer: {
            accessMode: "visitor_private",
            id: "demo-sandbox",
            name: "Demo Sandbox",
          },
          latestCompaction: null,
          memoryEvents: [],
          memories: [],
          messages: [],
          relevantMemories: [],
          thread: {
            createdAt: "2026-05-23T00:00:02.000Z",
            customerId: "demo-sandbox",
            id: "thread-2",
            title: "Demo Sandbox memory thread",
            updatedAt: "2026-05-23T00:00:02.000Z",
            visitorId: "visitor-123",
          },
          threads: [],
        }),
      },
      {
        isReadonly: false,
        visitorId: "visitor-123",
      }
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      customer: { id: "demo-sandbox" },
      thread: { id: "thread-2" },
    });
  });

  it("rejects thread creation for shared readonly demo accounts", async () => {
    const response = await handleCustomerMemoryThreadCreateRequest(
      new Request("http://localhost/api/demos/customer-memory-agent/session", {
        body: JSON.stringify({
          customerId: "acme-co",
        }),
        method: "POST",
      }),
      {
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      },
      {
        createCustomerMemoryThread: vi.fn(),
        loadCustomerMemorySession: vi.fn(),
      },
      {
        isReadonly: false,
        visitorId: "visitor-123",
      }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error:
        'Customer-memory demo account "Acme Co" is read-only. Switch to Demo Sandbox to create your own threads.',
    });
  });
});
