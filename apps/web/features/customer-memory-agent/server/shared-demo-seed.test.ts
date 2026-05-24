import { describe, expect, it, vi } from "vitest";

import { getCustomerMemoryProfile } from "../customer-profiles";

import {
  ensureCustomerMemorySharedDemoSeed,
  getCustomerMemorySharedDemoSnapshot,
} from "./shared-demo-seed";

describe("customer memory shared demo seed", () => {
  it("creates one canonical shared demo thread with memories and compaction", async () => {
    const customer = getCustomerMemoryProfile("acme-co");

    if (!customer) {
      throw new Error("Expected acme-co customer profile.");
    }

    const listThreads = vi.fn().mockResolvedValue([]);
    const createThread = vi.fn().mockResolvedValue({
      createdAt: "2026-05-23T00:00:01.000Z",
      customerId: "acme-co",
      id: "thread-1",
      title: "Launch review thread",
      updatedAt: "2026-05-23T00:00:01.000Z",
      visitorId: "demo-shared",
    });
    const saveThreadMessages = vi.fn().mockResolvedValue(undefined);
    const seedMemories = vi.fn().mockResolvedValue([]);
    const saveCompaction = vi.fn().mockResolvedValue(undefined);

    await ensureCustomerMemorySharedDemoSeed(customer, {
      compactionStore: { saveCompaction },
      memoryLifecycle: { seedMemories },
      threadStore: {
        createThread,
        listThreads,
        saveThreadMessages,
      },
    });

    const snapshot = getCustomerMemorySharedDemoSnapshot("acme-co");

    expect(listThreads).toHaveBeenCalledWith({
      customerId: "acme-co",
      visitorId: "demo-shared",
    });
    expect(createThread).toHaveBeenCalledWith({
      customerId: "acme-co",
      title: snapshot?.threadTitle,
      visitorId: "demo-shared",
    });
    expect(saveThreadMessages).toHaveBeenCalledWith({
      messages: snapshot?.messages,
      threadId: "thread-1",
    });
    expect(seedMemories).toHaveBeenCalledWith(snapshot?.memories, {
      customerId: "acme-co",
      threadId: "thread-1",
      visitorId: "demo-shared",
    });
    expect(saveCompaction).toHaveBeenCalledWith({
      messageCount: snapshot?.compaction.messageCount,
      summary: snapshot?.compaction.summary,
      threadId: "thread-1",
    });
  });

  it("skips seeding when the shared demo already has threads", async () => {
    const customer = getCustomerMemoryProfile("helio-dev");

    if (!customer) {
      throw new Error("Expected helio-dev customer profile.");
    }

    const listThreads = vi.fn().mockResolvedValue([
      {
        createdAt: "2026-05-23T00:00:01.000Z",
        customerId: "helio-dev",
        id: "thread-1",
        messageCount: 6,
        title: "Incident follow-up thread",
        updatedAt: "2026-05-23T00:00:01.000Z",
        visitorId: "demo-shared",
      },
    ]);
    const createThread = vi.fn();
    const saveThreadMessages = vi.fn();
    const seedMemories = vi.fn();
    const saveCompaction = vi.fn();

    await ensureCustomerMemorySharedDemoSeed(customer, {
      compactionStore: { saveCompaction },
      memoryLifecycle: { seedMemories },
      threadStore: {
        createThread,
        listThreads,
        saveThreadMessages,
      },
    });

    expect(createThread).not.toHaveBeenCalled();
    expect(saveThreadMessages).not.toHaveBeenCalled();
    expect(seedMemories).not.toHaveBeenCalled();
    expect(saveCompaction).not.toHaveBeenCalled();
  });
});
