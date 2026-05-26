import {
  type DynamicToolUIPart,
  type FileUIPart,
  isReasoningUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";

export type UltraChatbotAgentToolPart = DynamicToolUIPart | ToolUIPart;

export interface UltraChatbotAgentDocumentToolResult {
  id: string;
  kind: string;
  title: string;
}

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

export function isUltraChatbotAgentToolPart(
  part: UIMessage["parts"][number]
): part is UltraChatbotAgentToolPart {
  return part.type === "dynamic-tool" || part.type.startsWith("tool-");
}

export function getUltraChatbotAgentToolParts(message: UIMessage) {
  return message.parts.filter(isUltraChatbotAgentToolPart);
}

export function hasUltraChatbotAgentVisibleMessageContent(message: UIMessage) {
  return message.parts.some(
    (part) =>
      (part.type === "text" && part.text.trim().length > 0) ||
      (isReasoningUIPart(part) && part.text.trim().length > 0) ||
      isUltraChatbotAgentToolPart(part)
  );
}

export function isUltraChatbotAgentDocumentResult(
  output: UltraChatbotAgentToolPart["output"]
): output is UltraChatbotAgentDocumentToolResult {
  if (!output || typeof output !== "object") {
    return false;
  }

  return (
    "id" in output &&
    typeof output.id === "string" &&
    "title" in output &&
    typeof output.title === "string" &&
    "kind" in output &&
    typeof output.kind === "string"
  );
}
