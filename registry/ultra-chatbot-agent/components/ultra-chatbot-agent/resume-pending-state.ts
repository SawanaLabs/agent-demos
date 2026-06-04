import type { UIMessage } from "ai";

import type { UltraChatbotAgentChatSession } from "@/lib/ultra-chatbot-agent/server/chat-store";

export function shouldShowUltraChatbotAgentResumeThinking(input: {
  initialSession: UltraChatbotAgentChatSession | null;
  messages: UIMessage[];
}) {
  const { initialSession, messages } = input;

  if (!initialSession?.chat.activeStreamId) {
    return false;
  }

  return messages.at(-1)?.role === "user";
}
