import type { UIMessage } from "ai";

export interface EveAgentMessageMetadata {
  finishedAt?: number;
  finishReason?: string;
  model?: string;
  runId?: string;
  startedAt?: number;
  totalUsage?: unknown;
}

export type EveAgentUIMessage = UIMessage<EveAgentMessageMetadata>;
