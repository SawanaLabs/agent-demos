import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import { prepareRouteBackedChatReplay } from "./route-backed-chat-replay";

function createMessage(id: string, role: UIMessage["role"], text: string) {
  return {
    id,
    parts: [{ text, type: "text" }],
    role,
  } satisfies UIMessage;
}

describe("route-backed chat replay", () => {
  it("replays from the stored user turn when regenerating a persisted assistant response", () => {
    const userMessage = createMessage("user-1", "user", "Draft the plan.");
    const assistantMessage = createMessage(
      "assistant-1",
      "assistant",
      "Here is the first draft."
    );

    expect(
      prepareRouteBackedChatReplay({
        incomingMessage: userMessage,
        messageId: assistantMessage.id,
        persistedMessages: [userMessage, assistantMessage],
        trigger: "regenerate-message",
      })
    ).toEqual({
      messages: [userMessage],
      trimAfterMessageId: userMessage.id,
    });
  });
});
