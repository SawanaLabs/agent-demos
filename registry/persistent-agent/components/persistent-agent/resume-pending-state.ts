import type { UIMessage } from "ai";

import type { PersistentAgentChatSession } from "@/lib/persistent-agent/server/chat-store";

export function shouldShowResumeThinking(input: {
  initialSession: PersistentAgentChatSession | null;
  messages: UIMessage[];
}) {
  const { initialSession, messages } = input;

  if (!initialSession?.chat.activeStreamId) {
    return false;
  }

  return messages.at(-1)?.role === "user";
}
