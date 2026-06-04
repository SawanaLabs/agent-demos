import type { AgentInputItem } from "@openai/agents";
import type { UIMessage } from "ai";

import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";

type DemoEnv = Record<string, string | undefined>;

const defaultMaxTurns = 8;
const defaultWorkflowName = "openai-agents-sdk-demo";
const noUserInputErrorMessage =
  "At least one user message is required before starting an agent run.";

export class OpenAiAgentsSdkDemoRunInputError extends Error {}

export interface OpenAiAgentsSdkDemoRunProfile {
  continuationStrategy: "previous-response-id-or-memory-session";
  maxTurns: number;
  usesRequestSignal: true;
  workflowName: string;
}

export interface OpenAiAgentsSdkDemoRunRequestOptions {
  messages: UIMessage[];
  signal?: AbortSignal;
}

export function getOpenAiAgentsSdkDemoRunProfile(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoRunProfile {
  const configuredMaxTurns = Number.parseInt(
    env.OPENAI_AGENTS_MAX_TURNS ?? "",
    10
  );

  return {
    continuationStrategy: "previous-response-id-or-memory-session",
    maxTurns:
      Number.isFinite(configuredMaxTurns) && configuredMaxTurns > 0
        ? configuredMaxTurns
        : defaultMaxTurns,
    usesRequestSignal: true,
    workflowName: defaultWorkflowName,
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

function getLatestAssistantResponseId(messages: UIMessage[]) {
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  if (!latestAssistantMessage?.metadata) {
    return;
  }

  return (latestAssistantMessage.metadata as OpenAiAgentsSdkDemoMessageMetadata)
    .lastResponseId;
}

function hasLatestAssistantSessionId(messages: UIMessage[]) {
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");

  const metadata = latestAssistantMessage?.metadata as
    | OpenAiAgentsSdkDemoMessageMetadata
    | undefined;

  return Boolean(metadata?.sessionSummary?.sessionId);
}

function isOpenAiResponsesResponseId(responseId: string | undefined) {
  return responseId?.startsWith("resp_") ?? false;
}

function getLatestUserInput(messages: UIMessage[]) {
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  if (!latestUserMessage) {
    return null;
  }

  const content = getMessageText(latestUserMessage);

  if (!content) {
    return null;
  }

  return [createUserInputItem(content)];
}

function isUserAgentInputItem(
  item: AgentInputItem
): item is AgentInputItem & { role: "user" } {
  return "role" in item && item.role === "user";
}

function assertHasUserInput(input: AgentInputItem[]) {
  if (input.some(isUserAgentInputItem)) {
    return;
  }

  throw new OpenAiAgentsSdkDemoRunInputError(noUserInputErrorMessage);
}

export function getOpenAiAgentsSdkDemoRunInputErrorMessage(error: unknown) {
  if (error instanceof OpenAiAgentsSdkDemoRunInputError) {
    return error.message;
  }

  return null;
}

export function getOpenAiAgentsSdkDemoRunRequest(
  { messages, signal }: OpenAiAgentsSdkDemoRunRequestOptions,
  env: DemoEnv = process.env
): {
  input: AgentInputItem[];
  options: {
    maxTurns: number;
    previousResponseId?: string;
    signal?: AbortSignal;
    stream: true;
  };
} {
  const profile = getOpenAiAgentsSdkDemoRunProfile(env);
  const latestAssistantResponseId = getLatestAssistantResponseId(messages);
  const previousResponseId = isOpenAiResponsesResponseId(
    latestAssistantResponseId
  )
    ? latestAssistantResponseId
    : undefined;
  const latestUserInput =
    previousResponseId || hasLatestAssistantSessionId(messages)
      ? getLatestUserInput(messages)
      : null;
  const input = latestUserInput ?? convertToAgentInput(messages);

  assertHasUserInput(input);

  return {
    input,
    options: {
      ...(previousResponseId ? { previousResponseId } : {}),
      ...(signal ? { signal } : {}),
      maxTurns: profile.maxTurns,
      stream: true,
    },
  };
}

export function getOpenAiAgentsSdkDemoRunningUsageMetadata(
  lastResponseId?: string
) {
  if (!lastResponseId) {
    return;
  }

  return {
    lastResponseId,
    usedGuideIds: ["running-agents"],
  } satisfies OpenAiAgentsSdkDemoMessageMetadata;
}
