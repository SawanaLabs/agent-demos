import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import type { PersistentAgentChatSession } from "../server/chat-store";

import { shouldShowResumeThinking } from "./resume-pending-state";

function createUserMessage(): UIMessage {
  return {
    id: "user-1",
    parts: [{ text: "hi", type: "text" }],
    role: "user",
  };
}

function createAssistantMessage(): UIMessage {
  return {
    id: "assistant-1",
    parts: [{ text: "hello", type: "text" }],
    role: "assistant",
  };
}

function createSession(
  activeStreamId: string | null
): PersistentAgentChatSession {
  return {
    chat: {
      activeStreamId,
      createdAt: "2026-05-25T00:00:00.000Z",
      id: "chat-1",
      title: "New chat",
      updatedAt: "2026-05-25T00:00:00.000Z",
      visitorId: "visitor-1",
    },
    messages: [createUserMessage()],
  };
}

describe("persistent-agent resume pending state", () => {
  it("shows thinking when a restored session still has an active stream and ends on a user message", () => {
    expect(
      shouldShowResumeThinking({
        initialSession: createSession("stream-1"),
        messages: [createUserMessage()],
      })
    ).toBe(true);
  });

  it("stops showing thinking after the assistant message arrives", () => {
    expect(
      shouldShowResumeThinking({
        initialSession: createSession("stream-1"),
        messages: [createUserMessage(), createAssistantMessage()],
      })
    ).toBe(false);
  });

  it("does not show thinking when there is no active stream to resume", () => {
    expect(
      shouldShowResumeThinking({
        initialSession: createSession(null),
        messages: [createUserMessage()],
      })
    ).toBe(false);
  });
});
