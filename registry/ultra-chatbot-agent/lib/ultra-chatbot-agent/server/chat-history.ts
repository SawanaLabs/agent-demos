import { isFileUIPart, isTextUIPart, type UIMessage } from "ai";

function getReplayableAssistantText(message: UIMessage) {
  return message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export function projectUltraChatbotAgentHistoryForModel(messages: UIMessage[]) {
  return messages.flatMap((message) => {
    if (message.role === "assistant") {
      const text = getReplayableAssistantText(message);

      return text
        ? [
            {
              id: message.id,
              parts: [
                {
                  text,
                  type: "text" as const,
                },
              ],
              role: "assistant" as const,
            },
          ]
        : [];
    }

    if (message.role === "user") {
      const parts = message.parts.filter(
        (part) => isTextUIPart(part) || isFileUIPart(part)
      );

      return parts.length > 0
        ? [
            {
              ...message,
              parts,
            },
          ]
        : [];
    }

    if (message.role === "system") {
      const parts = message.parts.filter(isTextUIPart);

      return parts.length > 0
        ? [
            {
              ...message,
              parts,
            },
          ]
        : [];
    }

    return [];
  });
}
