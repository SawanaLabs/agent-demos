import { generateText, type UIMessage } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildCustomerMemoryCompactionInput,
  generateCustomerMemoryCompactionSummary,
  getCustomerMemoryCompactionTargetMessageCount,
} from "./compaction";

vi.mock("ai", () => ({
  generateText: vi.fn(),
  getToolName: (part: { toolName?: string; type: string }) =>
    part.toolName ??
    (part.type.startsWith("tool-") ? part.type.slice(5) : part.type),
  isToolUIPart: (part: { type: string }) =>
    part.type === "dynamic-tool" || part.type.startsWith("tool-"),
}));

vi.mock("@/features/shared/ai-gateway/server/env", () => ({
  createAiGateway: () => (modelId: string) => ({ modelId }),
  getAiGatewayConfig: () => ({
    chatModel: "openai/gpt-4.1-mini",
  }),
}));

function createMessages(): UIMessage[] {
  return [
    {
      id: "user-1",
      parts: [
        {
          text: "Acme needs launch notes written for executives.",
          type: "text",
        },
      ],
      role: "user",
    },
    {
      id: "assistant-1",
      parts: [
        {
          text: "Understood. I will keep the tone executive-ready.",
          type: "text",
        },
      ],
      role: "assistant",
    },
  ];
}

describe("customer memory compaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns no compaction target before the message threshold is reached", () => {
    expect(
      getCustomerMemoryCompactionTargetMessageCount({
        latestCompaction: null,
        messageCount: 2,
      })
    ).toBeNull();
  });

  it("returns the older window size once the threshold is crossed", () => {
    expect(
      getCustomerMemoryCompactionTargetMessageCount({
        latestCompaction: null,
        messageCount: 3,
      })
    ).toBe(1);
  });

  it("returns no target when the latest compaction already covers the older window", () => {
    expect(
      getCustomerMemoryCompactionTargetMessageCount({
        latestCompaction: {
          createdAt: "2026-05-23T02:00:01.000Z",
          id: "compaction-1",
          messageCount: 1,
          summary: "Older context already compacted.",
          threadId: "thread-1",
        },
        messageCount: 3,
      })
    ).toBeNull();
  });

  it("builds the next handoff window from the previous handoff and only newly compactable messages", () => {
    const input = buildCustomerMemoryCompactionInput({
      latestCompaction: {
        createdAt: "2026-05-23T02:00:01.000Z",
        id: "compaction-1",
        messageCount: 1,
        summary: "Acme already prefers executive-ready updates.",
        threadId: "thread-1",
      },
      messages: [
        ...createMessages(),
        {
          id: "user-2",
          parts: [
            { text: "Friday remains the weekly update day.", type: "text" },
          ],
          role: "user",
        },
        {
          id: "assistant-2",
          parts: [{ text: "I will use Friday.", type: "text" }],
          role: "assistant",
        },
      ],
      targetMessageCount: 2,
    });

    expect(input.previousHandoff).toBe(
      "Acme already prefers executive-ready updates."
    );
    expect(input.messages).toEqual([
      expect.objectContaining({ id: "assistant-1" }),
    ]);
  });

  it("formats a handoff compaction from the previous handoff and new transcript window", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: "  ## Current customer state\nAcme needs executive-ready launch notes.  ",
    } as Awaited<ReturnType<typeof generateText>>);

    const summary = await generateCustomerMemoryCompactionSummary(
      {
        customerLabel: "Acme Co",
        messages: createMessages(),
        previousHandoff:
          "Acme already prefers plain-text, executive-ready account updates.",
      },
      process.env
    );

    expect(summary).toBe(
      "## Current customer state\nAcme needs executive-ready launch notes."
    );
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        model: { modelId: "openai/gpt-4.1-mini" },
        prompt: expect.stringContaining("Previous handoff:"),
        system: expect.stringContaining(
          "CUSTOMER SUPPORT CONTEXT CHECKPOINT COMPACTION"
        ),
      })
    );
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining(
          "Acme already prefers plain-text, executive-ready account updates."
        ),
      })
    );
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining(
          "USER: Acme needs launch notes written for executives."
        ),
      })
    );
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining(
          "ASSISTANT: Understood. I will keep the tone executive-ready."
        ),
      })
    );
  });

  it("keeps memory tool writes visible in the handoff transcript", async () => {
    vi.mocked(generateText).mockResolvedValue({
      text: "Tool write carried into handoff.",
    } as Awaited<ReturnType<typeof generateText>>);

    await generateCustomerMemoryCompactionSummary({
      customerLabel: "Acme Co",
      messages: [
        {
          id: "assistant-tool",
          parts: [
            {
              input: {
                category: "promise",
                content: "Acme needs launch notes by Monday.",
                operation: "add",
                reason: "Durable promised customer deadline.",
                sourceMessageId: "user-1",
                title: "Launch note deadline",
              },
              output: {
                accepted: true,
                operation: "add",
                title: "Launch note deadline",
              },
              state: "output-available",
              toolCallId: "tool-1",
              type: "tool-manageCustomerMemory",
            },
          ],
          role: "assistant",
        },
      ],
    });

    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("TOOL manageCustomerMemory"),
      })
    );
    expect(generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining("Acme needs launch notes by Monday."),
      })
    );
  });

  it("throws when asked to compact an empty message window", async () => {
    await expect(
      generateCustomerMemoryCompactionSummary({
        customerLabel: "Acme Co",
        messages: [
          {
            id: "assistant-tool",
            parts: [],
            role: "assistant",
          },
        ],
      })
    ).rejects.toThrow(
      "Cannot compact an empty customer-memory message window."
    );
  });
});
