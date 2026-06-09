import type { UIMessage } from "ai";
import { describe, expect, it, vi } from "vitest";

import { handleCustomerMemoryManualCompactionRequest } from "./manual-compaction";

const env = {
  AI_GATEWAY_API_KEY: "test-key",
  DATABASE_URL: "postgresql://user:password@localhost:5432/database",
};

function createMessages(): UIMessage[] {
  return [
    {
      id: "user-1",
      parts: [
        { text: "Remember the compliance-safe rollout policy.", type: "text" },
      ],
      role: "user",
    },
    {
      id: "assistant-1",
      parts: [{ text: "I will keep rollout language factual.", type: "text" }],
      role: "assistant",
    },
    {
      id: "user-2",
      parts: [{ text: "The next update is due Tuesday.", type: "text" }],
      role: "user",
    },
  ];
}

function createManualCompactionRequest(
  input: { customerId?: string; threadId?: string } = {}
) {
  return new Request(
    "http://localhost/api/demos/customer-memory-agent/compact",
    {
      body: JSON.stringify({
        customerId: input.customerId ?? "demo-sandbox",
        threadId: input.threadId ?? "thread-1",
      }),
      method: "POST",
    }
  );
}

function createThreadSnapshot(messages: UIMessage[] = createMessages()) {
  return {
    messages,
    thread: {
      createdAt: "2026-06-09T00:00:00.000Z",
      customerId: "demo-sandbox",
      id: "thread-1",
      title: "Demo Sandbox memory thread",
      updatedAt: "2026-06-09T00:00:00.000Z",
      visitorId: "visitor-123",
    },
  };
}

describe("customer memory manual compaction runtime", () => {
  it("creates a handoff compaction for older uncompacted thread messages", async () => {
    const generateSummary = vi.fn().mockResolvedValue("Older handoff summary.");
    const saveCompaction = vi.fn().mockResolvedValue({
      createdAt: "2026-06-09T00:00:00.000Z",
      id: "compaction-1",
      messageCount: 1,
      summary: "Older handoff summary.",
      threadId: "thread-1",
    });

    const response = await handleCustomerMemoryManualCompactionRequest(
      createManualCompactionRequest(),
      {
        isReadonly: false,
        visitorId: "visitor-123",
      },
      env,
      {
        compactionStore: {
          getLatestCompaction: vi.fn().mockResolvedValue(null),
          saveCompaction,
        },
        generateSummary,
        threadStore: {
          loadThreadForViewer: vi
            .fn()
            .mockResolvedValue(createThreadSnapshot()),
        },
      }
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      compaction: {
        messageCount: 1,
        summary: "Older handoff summary.",
        threadId: "thread-1",
      },
    });
    expect(generateSummary).toHaveBeenCalledWith(
      {
        customerLabel: "Brightfield Health",
        messages: [expect.objectContaining({ id: "user-1" })],
        previousHandoff: null,
      },
      env
    );
    expect(saveCompaction).toHaveBeenCalledWith({
      messageCount: 1,
      summary: "Older handoff summary.",
      threadId: "thread-1",
    });
  });

  it("rejects manual compaction when only the recent live window exists", async () => {
    const response = await handleCustomerMemoryManualCompactionRequest(
      createManualCompactionRequest(),
      {
        isReadonly: false,
        visitorId: "visitor-123",
      },
      env,
      {
        compactionStore: {
          getLatestCompaction: vi.fn().mockResolvedValue(null),
          saveCompaction: vi.fn(),
        },
        generateSummary: vi.fn(),
        threadStore: {
          loadThreadForViewer: vi
            .fn()
            .mockResolvedValue(
              createThreadSnapshot(createMessages().slice(0, 2))
            ),
        },
      }
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "No older customer-memory messages are available to compact yet.",
    });
  });

  it("rejects read-only customer profiles before loading a thread", async () => {
    const loadThreadForViewer = vi.fn();
    const generateSummary = vi.fn();

    const response = await handleCustomerMemoryManualCompactionRequest(
      createManualCompactionRequest({ customerId: "acme-co" }),
      {
        isReadonly: false,
        visitorId: "visitor-123",
      },
      env,
      {
        compactionStore: {
          getLatestCompaction: vi.fn(),
          saveCompaction: vi.fn(),
        },
        generateSummary,
        threadStore: {
          loadThreadForViewer,
        },
      }
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error:
        'Customer-memory demo account "Acme Co" is read-only. Switch to Demo Sandbox to create your own threads.',
    });
    expect(loadThreadForViewer).not.toHaveBeenCalled();
    expect(generateSummary).not.toHaveBeenCalled();
  });

  it("rejects thread ids outside the current visitor scope", async () => {
    const getLatestCompaction = vi.fn();
    const loadThreadForViewer = vi.fn().mockResolvedValue(null);

    const response = await handleCustomerMemoryManualCompactionRequest(
      createManualCompactionRequest(),
      {
        isReadonly: false,
        visitorId: "visitor-123",
      },
      env,
      {
        compactionStore: {
          getLatestCompaction,
          saveCompaction: vi.fn(),
        },
        generateSummary: vi.fn(),
        threadStore: {
          loadThreadForViewer,
        },
      }
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "No customer-memory thread found for thread-1 under demo-sandbox.",
    });
    expect(loadThreadForViewer).toHaveBeenCalledWith({
      customerId: "demo-sandbox",
      threadId: "thread-1",
      visitorId: "visitor-123",
    });
    expect(getLatestCompaction).not.toHaveBeenCalled();
  });
});
