import { type AgentInputItem, MemorySession } from "@openai/agents";
import type { UIMessage } from "ai";
import { z } from "zod";

import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";

const sessionStore = new Map<string, MemorySession>();

export const openAiAgentsSdkDemoSessionSummarySchema = z.object({
  historyItemCount: z.number().int().nonnegative(),
  sessionId: z.string(),
  sessionKind: z.literal("MemorySession"),
  storageScope: z.literal("process-local"),
});

export interface OpenAiAgentsSdkDemoSessionProfile {
  historyStorage: "process-local";
  sdkPrimitive: "MemorySession";
  sessionTransport: "assistant-message metadata";
  supportsCrudHelpers: true;
}

export function getOpenAiAgentsSdkDemoSessionProfile(): OpenAiAgentsSdkDemoSessionProfile {
  return {
    historyStorage: "process-local",
    sdkPrimitive: "MemorySession",
    sessionTransport: "assistant-message metadata",
    supportsCrudHelpers: true,
  };
}

function getMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function createUserInputItem(content: string): AgentInputItem {
  return {
    content,
    role: "user",
  };
}

function createAssistantInputItem(content: string): AgentInputItem {
  return {
    content: [{ text: content, type: "output_text" }],
    role: "assistant",
    status: "completed",
  };
}

function convertToAgentInput(messages: UIMessage[]): AgentInputItem[] {
  const items: AgentInputItem[] = [];

  for (const message of messages) {
    if (message.role !== "assistant" && message.role !== "user") {
      continue;
    }

    const content = getMessageText(message);

    if (!content) {
      continue;
    }

    items.push(
      message.role === "assistant"
        ? createAssistantInputItem(content)
        : createUserInputItem(content)
    );
  }

  return items;
}

function getLatestAssistantSessionId(messages: UIMessage[]) {
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  const metadata = latestAssistantMessage?.metadata as
    | OpenAiAgentsSdkDemoMessageMetadata
    | undefined;

  return metadata?.sessionSummary?.sessionId;
}

function getRehydrationSeedItems(messages: UIMessage[]) {
  const sessionItems = convertToAgentInput(messages);
  const latestMessage = messages.at(-1);

  if (latestMessage?.role !== "user") {
    return sessionItems;
  }

  return sessionItems.slice(0, -1);
}

async function registerSession(session: MemorySession) {
  const sessionId = await session.getSessionId();

  sessionStore.set(sessionId, session);

  return session;
}

export async function getOpenAiAgentsSdkDemoSession(messages: UIMessage[]) {
  const sessionId = getLatestAssistantSessionId(messages);

  if (!sessionId) {
    return registerSession(new MemorySession());
  }

  const existingSession = sessionStore.get(sessionId);

  if (existingSession) {
    return existingSession;
  }

  return registerSession(
    new MemorySession({
      initialItems: getRehydrationSeedItems(messages),
      sessionId,
    })
  );
}

export async function getOpenAiAgentsSdkDemoSessionUsageMetadata(
  session: MemorySession
) {
  const [sessionId, historyItems] = await Promise.all([
    session.getSessionId(),
    session.getItems(),
  ]);

  return {
    sessionSummary: {
      historyItemCount: historyItems.length,
      sessionId,
      sessionKind: "MemorySession",
      storageScope: "process-local",
    },
    usedGuideIds: ["sessions"],
  } satisfies OpenAiAgentsSdkDemoMessageMetadata;
}

export function clearOpenAiAgentsSdkDemoSessionStore() {
  sessionStore.clear();
}
