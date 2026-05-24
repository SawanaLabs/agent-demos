import type { UIMessage } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CustomerMemoryProfile } from "../customer-profiles";

const aiMockState = vi.hoisted(() => ({
  responseOptions: null as null | {
    generateMessageId?: () => string;
    originalMessages?: UIMessage[];
  },
  streamText: vi.fn(),
}));

vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");

  return {
    ...actual,
    streamText: aiMockState.streamText,
  };
});

async function importConversationModule() {
  return import("./conversation");
}

function createCustomer(): CustomerMemoryProfile {
  return {
    accessMode: "visitor_private",
    accountSummary: "Healthcare onboarding account.",
    id: "demo-sandbox",
    industry: "Healthcare",
    name: "Brightfield Health",
    operatingNotes: ["Keep compliance updates factual."],
  };
}

function createMessages(): UIMessage[] {
  return [
    {
      id: "user-1",
      parts: [{ text: "Remember that compliance edits are due Tuesday.", type: "text" }],
      role: "user",
    },
  ];
}

describe("customer memory conversation persistence", () => {
  beforeEach(() => {
    aiMockState.responseOptions = null;
    aiMockState.streamText.mockReset();
    aiMockState.streamText.mockReturnValue({
      toUIMessageStreamResponse(options: typeof aiMockState.responseOptions) {
        aiMockState.responseOptions = options;
        return Response.json({ ok: true });
      },
    });
  });

  it("uses AI SDK server-side message id generation for persisted assistant responses", async () => {
    const { streamCustomerMemoryConversation } = await importConversationModule();
    const originalMessages = createMessages();

    const response = await streamCustomerMemoryConversation(
      {
        customer: createCustomer(),
        messages: originalMessages,
        threadId: "7dad003a-e507-448b-ac02-10937a0290da",
        visitorId: "visitor-123",
      },
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://user:password@localhost:5432/database",
      },
      {
        findRelevantMemory: vi.fn().mockResolvedValue([]),
        getLatestCompaction: vi.fn().mockResolvedValue(null),
      }
    );

    expect(response.status).toBe(200);
    expect(aiMockState.responseOptions?.originalMessages).toBe(
      originalMessages
    );
    expect(aiMockState.responseOptions?.generateMessageId).toEqual(
      expect.any(Function)
    );

    const firstGeneratedId = aiMockState.responseOptions?.generateMessageId?.();
    const secondGeneratedId = aiMockState.responseOptions?.generateMessageId?.();

    expect(firstGeneratedId).toMatch(/^cm-msg/);
    expect(secondGeneratedId).toMatch(/^cm-msg/);
    expect(firstGeneratedId).not.toBe(secondGeneratedId);
  });
});
