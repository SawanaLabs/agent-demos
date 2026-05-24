"use client";

import { isToolOrDynamicToolUIPart, type UIMessage } from "ai";

import type { CustomerMemoryProfile } from "../customer-profiles";
import type { CustomerMemorySessionData } from "../session-data";

const customerMemoryRecentMessageWindow = 2;

export interface CustomerMemorySessionViewState {
  activeThreadId: string | null;
  customer: CustomerMemoryProfile | null;
  hasMessages: boolean;
  latestPrompt: string;
  latestSummary: string | null;
  memoryCount: number;
  memoryEventCount: number;
  messageCount: number;
  relevantMemoryCount: number;
  threadCount: number;
}

export function getCustomerMemoryPendingCompaction(input: {
  compactionThreshold: number;
  isSessionLoading: boolean;
  latestCompactionMessageCount: number | null;
  messageCount: number;
  recentWindow?: number;
}) {
  if (
    !input.isSessionLoading ||
    input.messageCount < input.compactionThreshold
  ) {
    return null;
  }

  const recentWindow = input.recentWindow ?? customerMemoryRecentMessageWindow;
  const targetMessageCount = input.messageCount - recentWindow;

  if (targetMessageCount <= 0) {
    return null;
  }

  if (
    input.latestCompactionMessageCount !== null &&
    input.latestCompactionMessageCount >= targetMessageCount
  ) {
    return null;
  }

  return {
    messageCount: targetMessageCount,
  };
}

export function getCustomerMemoryMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export function getCustomerMemoryToolParts(message: UIMessage) {
  return message.parts.filter(isToolOrDynamicToolUIPart);
}

export function hasCustomerMemoryMessageContent(message: UIMessage) {
  return (
    getCustomerMemoryMessageText(message).length > 0 ||
    getCustomerMemoryToolParts(message).length > 0
  );
}

export function removeEmptyCustomerMemoryAssistantMessages(
  messages: UIMessage[]
) {
  return messages.filter(
    (message) =>
      message.role !== "assistant" || hasCustomerMemoryMessageContent(message)
  );
}

export function getLatestCustomerMemoryPrompt(messages: UIMessage[]) {
  for (const message of [...messages].reverse()) {
    if (message.role !== "user") {
      continue;
    }

    const text = getCustomerMemoryMessageText(message);

    if (text.length > 0) {
      return text;
    }
  }

  return "";
}

export function buildCustomerMemoryThreadLabel(input: {
  fallbackIndex: number;
  title: string | null;
}) {
  const trimmedTitle = input.title?.trim();

  if (trimmedTitle) {
    return trimmedTitle;
  }

  return `Thread ${input.fallbackIndex + 1}`;
}

export function formatCustomerMemoryCategory(category: string) {
  return category
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getCustomerMemorySamplePrompts(customerId: string) {
  switch (customerId) {
    case "demo-sandbox":
      return [
        "Remember that Brightfield Health requires compliance-safe rollout language and wants every customer-facing update to stay plain and factual.",
        "We promised Brightfield a revised launch update by Tuesday after the compliance review. Save that and draft the reply.",
        "How should I answer if Brightfield asks whether a rollout claim is safe to send to customers today?",
      ];
    case "northstar-logistics":
      return [
        "Remember that Northstar needs incident updates with a clear owner and next checkpoint.",
        "We promised the finance lead an outage summary by Friday. Save that and draft a response.",
        "How should I answer if Northstar asks for an update on billing-impact investigations?",
      ];
    case "helio-dev":
      return [
        "Remember that Helio Dev wants root-cause detail and concrete follow-up dates.",
        "We promised a patch ETA next Tuesday. Save that and draft the reply.",
        "How should I respond if Helio asks for a concise technical status update?",
      ];
    default:
      return [
        "Remember that Acme Co needs executive-safe status language and legal review on marketing claims.",
        "We promised Acme a rewritten launch note after legal review on Monday. Save that and reply.",
        "How should I answer if Acme asks whether a campaign claim is safe to publish?",
      ];
  }
}

export function buildCustomerMemorySessionViewState(
  session: CustomerMemorySessionData | null
): CustomerMemorySessionViewState {
  return {
    activeThreadId: session?.thread.id ?? null,
    customer: session?.customer ?? null,
    hasMessages: (session?.messages.length ?? 0) > 0,
    latestPrompt: getLatestCustomerMemoryPrompt(session?.messages ?? []),
    latestSummary: session?.latestCompaction?.summary ?? null,
    memoryEventCount: session?.memoryEvents.length ?? 0,
    memoryCount: session?.memories.length ?? 0,
    messageCount: session?.messages.length ?? 0,
    relevantMemoryCount: session?.relevantMemories.length ?? 0,
    threadCount: session?.threads.length ?? 0,
  };
}
