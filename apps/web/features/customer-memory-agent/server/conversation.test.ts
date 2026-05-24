import type { UIMessage } from "ai";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import type { CustomerMemoryProfile } from "../customer-profiles";
import {
  memoryOperationToolInputSchema,
  streamCustomerMemoryConversation,
} from "./conversation";

function createCustomer(): CustomerMemoryProfile {
  return {
    accessMode: "shared_readonly",
    accountSummary: "Enterprise retail account.",
    id: "acme-co",
    industry: "Retail SaaS",
    name: "Acme Co",
    operatingNotes: ["Plain-text email only."],
  };
}

function createMessages(): UIMessage[] {
  return [
    {
      id: "user-1",
      parts: [
        {
          text: "Remember that Acme only allows plain-text email.",
          type: "text",
        },
      ],
      role: "user",
    },
    {
      id: "assistant-1",
      parts: [{ text: "Understood.", type: "text" }],
      role: "assistant",
    },
    {
      id: "user-2",
      parts: [
        { text: "Please keep Friday as the weekly update day.", type: "text" },
      ],
      role: "user",
    },
  ];
}

describe("customer memory conversation", () => {
  it("exposes the memory tool input as a top-level object schema", () => {
    expect(memoryOperationToolInputSchema).toBeInstanceOf(z.ZodObject);
    expect(
      memoryOperationToolInputSchema.safeParse({
        operation: "noop",
        reason: "The user only asked a transient greeting question.",
      }).success
    ).toBe(true);
  });

  it("persists final messages, saved memories, and compaction work after a completed turn", async () => {
    const saveThreadMessages = vi.fn().mockResolvedValue(undefined);
    const applyMemoryOperations = vi.fn().mockResolvedValue([]);
    const maybeCompactThread = vi.fn().mockResolvedValue(undefined);
    const findRelevantMemory = vi.fn().mockResolvedValue([
      {
        accessCount: 0,
        category: "constraint",
        content: "Acme cannot send HTML email.",
        createdAt: "2026-05-23T01:00:01.000Z",
        customerId: "acme-co",
        id: "memory-1",
        lastAccessedAt: null,
        metadata: null,
        similarity: 0.92,
        sourceMessageId: "user-1",
        status: "active",
        threadId: "thread-1",
        title: "Email restriction",
        updatedAt: "2026-05-23T01:00:01.000Z",
        visitorId: "demo-shared",
      },
    ]);
    const createConversationResponse = vi.fn(
      async ({
        onFinish,
        originalMessages,
        queueMemoryDraft,
        systemPrompt,
      }: any) => {
        expect(systemPrompt).toContain("Relevant saved memories");
        expect(systemPrompt).toContain("Acme cannot send HTML email.");

        await queueMemoryDraft({
          category: "constraint",
          content: "Acme only allows plain-text email.",
          operation: "update",
          memoryId: "memory-1",
          reason: "The user clarified the durable constraint.",
          sourceMessageId: "user-1",
          title: "Email restriction",
        });

        await onFinish({
          finishReason: "stop" as const,
          isAborted: false,
          isContinuation: false,
          messages: [
            ...originalMessages,
            {
              id: "assistant-2",
              parts: [
                { text: "I will remember both constraints.", type: "text" },
              ],
              role: "assistant",
            },
          ],
          responseMessage: {
            id: "assistant-2",
            parts: [
              { text: "I will remember both constraints.", type: "text" },
            ],
            role: "assistant",
          },
        });

        return Response.json({ ok: true });
      }
    );

    const response = await streamCustomerMemoryConversation(
      {
        customer: createCustomer(),
        messages: createMessages(),
        threadId: "thread-1",
        visitorId: "demo-shared",
      },
      process.env,
      {
        createConversationResponse,
        findRelevantMemory,
        getLatestCompaction: vi.fn().mockResolvedValue(null),
        maybeCompactThread,
        applyMemoryOperations,
        saveThreadMessages,
      }
    );

    expect(response.status).toBe(200);
    expect(findRelevantMemory).toHaveBeenCalledWith(
      {
        customerId: "acme-co",
        query: "Please keep Friday as the weekly update day.",
        visitorId: "demo-shared",
      },
      process.env
    );
    expect(saveThreadMessages).toHaveBeenCalledWith({
      messages: expect.arrayContaining([
        expect.objectContaining({ id: "assistant-2", role: "assistant" }),
      ]),
      threadId: "thread-1",
    });
    expect(applyMemoryOperations).toHaveBeenCalledWith(
      [
        {
          category: "constraint",
          content: "Acme only allows plain-text email.",
          operation: "update",
          memoryId: "memory-1",
          reason: "The user clarified the durable constraint.",
          sourceMessageId: "user-1",
          title: "Email restriction",
        },
      ],
      {
        customer: createCustomer(),
        messages: createMessages(),
        threadId: "thread-1",
        visitorId: "demo-shared",
      }
    );
    expect(maybeCompactThread).toHaveBeenCalledWith({
      customer: createCustomer(),
      latestCompaction: null,
      messages: expect.arrayContaining([
        expect.objectContaining({ id: "assistant-2" }),
      ]),
      threadId: "thread-1",
    });
  });

  it("slices older messages out of the live context when a handoff compaction already exists", async () => {
    const createConversationResponse = vi
      .fn()
      .mockResolvedValue(Response.json({ ok: true }));

    await streamCustomerMemoryConversation(
      {
        customer: createCustomer(),
        messages: [
          ...createMessages(),
          {
            id: "assistant-2",
            parts: [{ text: "Friday updates confirmed.", type: "text" }],
            role: "assistant",
          },
        ],
        threadId: "thread-1",
        visitorId: "demo-shared",
      },
      process.env,
      {
        createConversationResponse,
        findRelevantMemory: vi.fn().mockResolvedValue([]),
        getLatestCompaction: vi.fn().mockResolvedValue({
          createdAt: "2026-05-23T02:00:01.000Z",
          id: "compaction-1",
          messageCount: 2,
          summary: "Older context already compacted.",
          threadId: "thread-1",
        }),
        maybeCompactThread: vi.fn().mockResolvedValue(undefined),
        applyMemoryOperations: vi.fn().mockResolvedValue([]),
        saveThreadMessages: vi.fn().mockResolvedValue(undefined),
      }
    );

    expect(createConversationResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          expect.objectContaining({ id: "user-2" }),
          expect.objectContaining({ id: "assistant-2" }),
        ],
      }),
      process.env
    );
  });
});
