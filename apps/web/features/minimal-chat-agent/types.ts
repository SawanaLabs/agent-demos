import type { UIMessage } from "ai";

export interface MinimalChatAgentMessageMetadata {
  finishedAt?: number;
  finishReason?: string;
  model?: string;
  runId?: string;
  startedAt?: number;
  totalUsage?: unknown;
}

export type MinimalChatAgentUIMessage =
  UIMessage<MinimalChatAgentMessageMetadata>;
