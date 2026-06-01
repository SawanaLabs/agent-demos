import { describe, expect, it } from "vitest";

import type { UltraChatbotAgentChatRecord } from "../server/chat-store";
import { mergeUltraChatbotAgentChatIntoHistory } from "./ultra-chatbot-agent-history-state";

function createChatRecord(
  input: Partial<UltraChatbotAgentChatRecord> = {}
): UltraChatbotAgentChatRecord {
  return {
    activeStreamId: null,
    capabilities: {
      sandboxEnabled: false,
    },
    createdAt: "2026-06-01T00:00:00.000Z",
    id: "chat-1",
    selectedChatModel: "openai/gpt-4.1-mini",
    title: "Test chat",
    updatedAt: "2026-06-01T00:00:00.000Z",
    visibility: "private",
    visitorId: "visitor-1",
    ...input,
  };
}

describe("ultra chatbot agent history state", () => {
  it("keeps the existing array reference when the current chat hint has not changed", () => {
    const chats = [createChatRecord()];

    expect(
      mergeUltraChatbotAgentChatIntoHistory(chats, createChatRecord())
    ).toBe(chats);
  });

  it("moves an updated chat record to the front", () => {
    const currentChat = createChatRecord({
      id: "chat-1",
      title: "Old title",
    });
    const otherChat = createChatRecord({
      id: "chat-2",
      title: "Other chat",
    });
    const incoming = createChatRecord({
      id: "chat-1",
      title: "New title",
    });

    expect(
      mergeUltraChatbotAgentChatIntoHistory([otherChat, currentChat], incoming)
    ).toEqual([incoming, otherChat]);
  });
});
