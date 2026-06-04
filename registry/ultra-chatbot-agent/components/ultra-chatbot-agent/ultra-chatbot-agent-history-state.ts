import type { UltraChatbotAgentChatRecord } from "@/lib/ultra-chatbot-agent/server/chat-store";

function areChatCapabilitiesEqual(
  left: UltraChatbotAgentChatRecord["capabilities"],
  right: UltraChatbotAgentChatRecord["capabilities"]
) {
  return left.sandboxEnabled === right.sandboxEnabled;
}

export function areUltraChatbotAgentChatRecordsEqual(
  left: UltraChatbotAgentChatRecord,
  right: UltraChatbotAgentChatRecord
) {
  return (
    left.activeStreamId === right.activeStreamId &&
    left.createdAt === right.createdAt &&
    left.id === right.id &&
    left.selectedChatModel === right.selectedChatModel &&
    left.title === right.title &&
    left.updatedAt === right.updatedAt &&
    left.visibility === right.visibility &&
    left.visitorId === right.visitorId &&
    areChatCapabilitiesEqual(left.capabilities, right.capabilities)
  );
}

export function mergeUltraChatbotAgentChatIntoHistory(
  chats: UltraChatbotAgentChatRecord[],
  incoming: UltraChatbotAgentChatRecord
) {
  const currentIndex = chats.findIndex((chat) => chat.id === incoming.id);
  const firstChat = chats[0];

  if (
    currentIndex === 0 &&
    firstChat &&
    areUltraChatbotAgentChatRecordsEqual(firstChat, incoming)
  ) {
    return chats;
  }

  const next = chats.filter((chat) => chat.id !== incoming.id);
  return [incoming, ...next];
}
