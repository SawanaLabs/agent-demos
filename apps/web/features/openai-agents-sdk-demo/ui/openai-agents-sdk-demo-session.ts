import { isToolUIPart, type FileUIPart, type UIMessage } from "ai";
import type { ToolPart } from "@workspace/ui/components/ai-elements/tool";

export function getOpenAiAgentsSdkDemoMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export function getOpenAiAgentsSdkDemoFileParts(message: UIMessage) {
  return message.parts.filter(
    (part): part is FileUIPart => part.type === "file"
  );
}

export function getOpenAiAgentsSdkDemoToolParts(message: UIMessage) {
  return message.parts.filter(isToolUIPart) as ToolPart[];
}

export function hasOpenAiAgentsSdkDemoVisibleContent(message: UIMessage) {
  return (
    getOpenAiAgentsSdkDemoMessageText(message).trim().length > 0 ||
    getOpenAiAgentsSdkDemoFileParts(message).length > 0 ||
    getOpenAiAgentsSdkDemoToolParts(message).length > 0
  );
}

export function getOpenAiAgentsSdkDemoToolName(part: ToolPart) {
  return part.type === "dynamic-tool"
    ? part.toolName
    : part.type.split("-").slice(1).join("-");
}
