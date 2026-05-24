import { isReasoningUIPart, isToolUIPart, type UIMessage } from "ai";

export const mcpAgentSamplePrompts = [
  "Review the project docs and tell me what MCP agent demo should cover.",
  "Check the local Next.js runtime for current errors, then explain what you found.",
  "List the ready demos and recommend the next checklist item.",
] as const;

export function getTextContent(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export function getReasoningText(message: UIMessage) {
  return message.parts
    .filter(isReasoningUIPart)
    .map((part) => part.text)
    .join("\n\n");
}

export function getToolParts(message: UIMessage) {
  return message.parts.filter(isToolUIPart);
}
