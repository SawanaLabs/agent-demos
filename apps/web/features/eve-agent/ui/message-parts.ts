import type { EveAgentUIMessage } from "../types";

type MessagePart = EveAgentUIMessage["parts"][number];

export interface ProjectedToolPart {
  input: unknown;
  output?: unknown;
  state: string;
  toolCallId: string;
  toolName: string;
}

function getText(part: MessagePart) {
  return part.type === "text" && part.text.trim().length > 0
    ? part.text.trim()
    : null;
}

function getReasoningText(part: MessagePart) {
  return part.type === "reasoning" ? part.text.trim() : null;
}

function projectToolPart(part: MessagePart): ProjectedToolPart | null {
  const isNamedToolPart = part.type.startsWith("tool-");
  const isDynamicToolPart = part.type === "dynamic-tool";

  if (!(isNamedToolPart || isDynamicToolPart)) {
    return null;
  }

  const toolPart = part as {
    input?: unknown;
    output?: unknown;
    state?: string;
    toolCallId?: string;
    toolName?: string;
  };

  return {
    input: toolPart.input,
    output: "output" in part ? toolPart.output : undefined,
    state: toolPart.state ?? "input-available",
    toolCallId: toolPart.toolCallId ?? "",
    toolName: isDynamicToolPart
      ? (toolPart.toolName ?? "tool")
      : part.type.slice("tool-".length),
  };
}

export function projectEveAgentMessage(message: EveAgentUIMessage) {
  const textParts = message.parts.map(getText).filter((text) => text !== null);
  const reasoningParts = message.parts
    .map(getReasoningText)
    .filter((text) => text !== null);
  const toolParts = message.parts
    .map(projectToolPart)
    .filter((part) => part !== null);

  return {
    hasReasoningSignal: reasoningParts.length > 0,
    reasoningText: reasoningParts.join("\n\n"),
    text: textParts.join("\n\n"),
    toolParts,
  };
}
