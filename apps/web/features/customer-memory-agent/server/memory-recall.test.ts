import { describe, expect, it, vi } from "vitest";
import {
  findRelevantCustomerMemory,
  indexCustomerMemories,
  type RetrievedCustomerMemory,
} from "./memory-recall";
import type { CustomerMemoryRecord } from "./memory-store";

function createEntry(
  overrides: Partial<CustomerMemoryRecord> = {}
): CustomerMemoryRecord {
  return {
    accessCount: 0,
    category: "constraint",
    content: "Acme cannot send HTML email.",
    createdAt: "2026-05-23T01:00:01.000Z",
    customerId: "acme-co",
    id: "memory-1",
    lastAccessedAt: null,
    metadata: null,
    sourceMessageId: "user-1",
    status: "active",
    threadId: "thread-1",
    title: "Email restriction",
    updatedAt: "2026-05-23T01:00:01.000Z",
    visitorId: "demo-shared",
    ...overrides,
  };
}

describe("customer memory recall", () => {
  it("indexes saved memory records with batch embeddings", async () => {
    const replaceEmbeddings = vi.fn().mockResolvedValue(undefined);
    const generateEmbeddings = vi.fn().mockResolvedValue([
      [0.1, 0.2],
      [0.3, 0.4],
    ]);

    await indexCustomerMemories(
      [createEntry(), createEntry({ id: "memory-2", title: "Weekly updates" })],
      {
        replaceEmbeddings,
      },
      {
        generateEmbeddings,
      }
    );

    expect(generateEmbeddings).toHaveBeenCalledWith(
      [
        "constraint\nEmail restriction\nAcme cannot send HTML email.",
        "constraint\nWeekly updates\nAcme cannot send HTML email.",
      ],
      expect.any(Object)
    );
    expect(replaceEmbeddings).toHaveBeenCalledWith([
      {
        content: "constraint\nEmail restriction\nAcme cannot send HTML email.",
        embedding: [0.1, 0.2],
        memoryId: "memory-1",
      },
      {
        content: "constraint\nWeekly updates\nAcme cannot send HTML email.",
        embedding: [0.3, 0.4],
        memoryId: "memory-2",
      },
    ]);
  });

  it("returns relevant memories for a non-empty query", async () => {
    const findMatches = vi
      .fn<
        ({
          customerId,
          queryEmbedding,
          visitorId,
        }: {
          customerId: string;
          queryEmbedding: number[];
          visitorId: string;
        }) => Promise<RetrievedCustomerMemory[]>
      >()
      .mockResolvedValue([
        {
          accessCount: 0,
          category: "promise",
          content: "Weekly status updates every Friday.",
          createdAt: "2026-05-23T01:00:02.000Z",
          customerId: "acme-co",
          id: "memory-2",
          lastAccessedAt: null,
          metadata: null,
          similarity: 0.88,
          sourceMessageId: "assistant-2",
          status: "active",
          threadId: "thread-1",
          title: "Weekly updates",
          updatedAt: "2026-05-23T01:00:02.000Z",
          visitorId: "demo-shared",
        },
      ]);
    const generateEmbedding = vi.fn().mockResolvedValue([0.7, 0.9]);
    const recordSearchHits = vi.fn().mockResolvedValue(undefined);

    await expect(
      findRelevantCustomerMemory(
        {
          customerId: "acme-co",
          query: "What cadence should we keep with Acme?",
          visitorId: "demo-shared",
        },
        process.env,
        {
          findMatches,
          generateEmbedding,
          recordSearchHits,
        }
      )
    ).resolves.toEqual([
      {
        accessCount: 0,
        category: "promise",
        content: "Weekly status updates every Friday.",
        createdAt: "2026-05-23T01:00:02.000Z",
        customerId: "acme-co",
        id: "memory-2",
        lastAccessedAt: null,
        metadata: null,
        similarity: 0.88,
        sourceMessageId: "assistant-2",
        status: "active",
        threadId: "thread-1",
        title: "Weekly updates",
        updatedAt: "2026-05-23T01:00:02.000Z",
        visitorId: "demo-shared",
      },
    ]);

    expect(generateEmbedding).toHaveBeenCalledWith(
      "What cadence should we keep with Acme?",
      process.env
    );
    expect(findMatches).toHaveBeenCalledWith({
      customerId: "acme-co",
      queryEmbedding: [0.7, 0.9],
      visitorId: "demo-shared",
    });
    expect(recordSearchHits).toHaveBeenCalledWith([
      expect.objectContaining({ id: "memory-2" }),
    ]);
  });

  it("returns early for a blank query without touching embeddings", async () => {
    const generateEmbedding = vi.fn();
    const findMatches = vi.fn();

    await expect(
      findRelevantCustomerMemory(
        {
          customerId: "acme-co",
          query: "   ",
          visitorId: "demo-shared",
        },
        process.env,
        {
          findMatches,
          generateEmbedding,
        }
      )
    ).resolves.toEqual([]);

    expect(generateEmbedding).not.toHaveBeenCalled();
    expect(findMatches).not.toHaveBeenCalled();
  });
});
