"use client";

import type { ToolPart } from "@/components/ai-elements/tool";
import { isReasoningUIPart, isToolUIPart, type UIMessage } from "ai";

import type { TraceEvalAgentMessage } from "@/lib/trace-eval-agent/model/trace-eval-run-record";

export interface TraceEvalAgentSamplePrompt {
  label: string;
  prompt: string;
}

export const traceEvalAgentSamplePrompts: TraceEvalAgentSamplePrompt[] = [
  {
    label: "Pick a tracing + eval stack for a Next.js AI agent",
    prompt:
      "Research the current Langfuse, Braintrust, and OpenTelemetry options for tracing and evaluating a Next.js AI agent. Use live web search, cite at least two sources, and recommend a production path.",
  },
  {
    label: "Compare Langfuse, Braintrust, and OpenTelemetry today",
    prompt:
      "Compare Langfuse, Braintrust, and OpenTelemetry for AI agent tracing and evaluation in a Next.js product team.",
  },
  {
    label: "When is AI Gateway web_search enough?",
    prompt:
      "Research the current Vercel AI Gateway search-tool story and explain when native web_search is enough versus when MCP is still needed.",
  },
];

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

export function getToolParts(message: UIMessage): ToolPart[] {
  return message.parts.filter(isToolUIPart);
}

export function getToolDisplayName(part: ToolPart) {
  return part.type === "dynamic-tool"
    ? part.toolName
    : part.type.split("-").slice(1).join("-");
}

function hasMeaningfulToolValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some(hasMeaningfulToolValue);
  }

  if (typeof value === "object") {
    return Object.values(value).some(hasMeaningfulToolValue);
  }

  return false;
}

export function hasVisibleToolPayload(part: ToolPart) {
  return Boolean(
    part.errorText ||
      hasMeaningfulToolValue(part.input) ||
      hasMeaningfulToolValue(part.output)
  );
}

export function getLatestTraceEvalMetadata(messages: UIMessage[]) {
  const assistantMessages = messages.filter(
    (message): message is TraceEvalAgentMessage => message.role === "assistant"
  );

  return assistantMessages.at(-1)?.metadata;
}

export function formatDuration(durationMs?: number) {
  if (durationMs === undefined) {
    return "Pending";
  }

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  return `${(durationMs / 1000).toFixed(2)}s`;
}

export function formatTokenCount(totalTokens?: number) {
  return totalTokens === undefined ? "Pending" : `${totalTokens} tokens`;
}
