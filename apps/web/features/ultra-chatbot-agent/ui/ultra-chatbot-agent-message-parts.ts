import { isReasoningUIPart, type FileUIPart, type UIMessage } from "ai";

export function getUltraChatbotAgentReasoningText(message: UIMessage) {
  return message.parts
    .filter(isReasoningUIPart)
    .map((part) => part.text)
    .join("\n\n");
}

export function getUltraChatbotAgentFileParts(message: UIMessage) {
  return message.parts.filter(
    (part): part is FileUIPart =>
      part.type === "file" && typeof part.url === "string"
  );
}
