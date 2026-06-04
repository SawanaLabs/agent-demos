import { RunState, type RunToolApprovalItem } from "@openai/agents";
import type { UIMessage } from "ai";
import { z } from "zod";

import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";

export const openAiAgentsSdkDemoApprovalDecisionSchema = z.object({
  approvalId: z.string(),
  approved: z.boolean(),
  reason: z.string().optional(),
});

export const openAiAgentsSdkDemoPendingApprovalSchema = z.object({
  agentName: z.string().optional(),
  approvalId: z.string(),
  argumentsPreview: z.string().optional(),
  toolCallId: z.string(),
  toolName: z.string(),
});

export const openAiAgentsSdkDemoApprovalSummarySchema = z.object({
  decisions: z.array(openAiAgentsSdkDemoApprovalDecisionSchema),
  hasPendingApprovals: z.boolean(),
  pendingApprovals: z.array(openAiAgentsSdkDemoPendingApprovalSchema),
  serializedRunState: z.string().optional(),
});

export class OpenAiAgentsSdkDemoApprovalError extends Error {}

const pendingApprovalMessage =
  "A tool approval is pending. Approve or reject it before continuing.";

function getLatestAssistantMessage(messages: UIMessage[]) {
  return [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
}

function getLatestAssistantMetadata(messages: UIMessage[]) {
  return getLatestAssistantMessage(messages)?.metadata as
    | OpenAiAgentsSdkDemoMessageMetadata
    | undefined;
}

function stringifyPreview(value: unknown) {
  if (typeof value === "undefined") {
    return;
  }

  const text =
    typeof value === "string" ? value : JSON.stringify(value, null, 0);
  const normalized = text.trim();

  if (!normalized) {
    return;
  }

  if (normalized.length <= 180) {
    return normalized;
  }

  return `${normalized.slice(0, 177)}...`;
}

function getApprovalId(interruption: RunToolApprovalItem) {
  const rawItem = interruption.rawItem as {
    callId?: string;
    id?: string;
  };

  return (
    rawItem.id ?? rawItem.callId ?? interruption.toolName ?? "tool-approval"
  );
}

function getToolCallId(interruption: RunToolApprovalItem) {
  const rawItem = interruption.rawItem as {
    callId?: string;
    id?: string;
  };

  return rawItem.callId ?? rawItem.id ?? interruption.toolName ?? "tool-call";
}

function getOpenAiAgentsSdkDemoApprovalResponses(messages: UIMessage[]) {
  const latestAssistantMessage = getLatestAssistantMessage(messages);

  if (!latestAssistantMessage) {
    return [];
  }

  return latestAssistantMessage.parts.flatMap((part) => {
    const toolPart = part as {
      approval?: {
        approved?: boolean;
        id?: string;
        reason?: string;
      };
      state?: string;
      type?: string;
    };

    if (
      (toolPart.type !== "dynamic-tool" &&
        !String(toolPart.type).startsWith("tool-")) ||
      toolPart.state !== "approval-responded" ||
      !toolPart.approval ||
      typeof toolPart.approval.id !== "string" ||
      typeof toolPart.approval.approved !== "boolean"
    ) {
      return [];
    }

    return [
      {
        approvalId: toolPart.approval.id,
        approved: toolPart.approval.approved,
        reason:
          typeof toolPart.approval.reason === "string"
            ? toolPart.approval.reason
            : undefined,
      },
    ];
  });
}

export function getOpenAiAgentsSdkDemoPendingApprovalMessage() {
  return pendingApprovalMessage;
}

export function getOpenAiAgentsSdkDemoApprovalErrorMessage(error: unknown) {
  if (error instanceof OpenAiAgentsSdkDemoApprovalError) {
    return error.message;
  }

  return null;
}

export function hasOpenAiAgentsSdkDemoPendingApproval(messages: UIMessage[]) {
  const approvalSummary = getLatestAssistantMetadata(messages)?.approvalSummary;

  return Boolean(approvalSummary?.hasPendingApprovals);
}

export function hasOpenAiAgentsSdkDemoApprovalResponses(messages: UIMessage[]) {
  return getOpenAiAgentsSdkDemoApprovalResponses(messages).length > 0;
}

export async function getOpenAiAgentsSdkDemoApprovalResumeState(
  messages: UIMessage[],
  agent: Parameters<typeof RunState.fromString>[0]
) {
  const approvalSummary = getLatestAssistantMetadata(messages)?.approvalSummary;
  const responses = getOpenAiAgentsSdkDemoApprovalResponses(messages);

  if (responses.length === 0) {
    return null;
  }

  if (!approvalSummary?.serializedRunState) {
    throw new OpenAiAgentsSdkDemoApprovalError(
      "The pending approval state is missing serialized run data. Start a new turn and reproduce the approval request."
    );
  }

  const state = await RunState.fromString(
    agent,
    approvalSummary.serializedRunState
  );
  const interruptions = state.getInterruptions();

  for (const response of responses) {
    const interruption = interruptions.find(
      (item) => getApprovalId(item) === response.approvalId
    );

    if (!interruption) {
      throw new OpenAiAgentsSdkDemoApprovalError(
        `Approval response ${response.approvalId} does not match any pending interruption.`
      );
    }

    if (response.approved) {
      state.approve(interruption);
      continue;
    }

    state.reject(interruption, {
      ...(response.reason ? { message: response.reason } : {}),
    });
  }

  return {
    responses,
    state,
  };
}

export function getOpenAiAgentsSdkDemoApprovalUsageMetadata({
  interruptions,
  responses = [],
  state,
}: {
  interruptions: RunToolApprovalItem[];
  responses?: Array<{
    approvalId: string;
    approved: boolean;
    reason?: string;
  }>;
  state?: {
    toString(): string;
  };
}) {
  if (interruptions.length === 0 && responses.length === 0) {
    return;
  }

  const pendingApprovals = interruptions.map((interruption) => ({
    ...(interruption.agent?.name ? { agentName: interruption.agent.name } : {}),
    approvalId: getApprovalId(interruption),
    ...(stringifyPreview(interruption.arguments)
      ? { argumentsPreview: stringifyPreview(interruption.arguments) }
      : {}),
    toolCallId: getToolCallId(interruption),
    toolName: interruption.toolName ?? "tool",
  }));
  const usedToolNames = Array.from(
    new Set(pendingApprovals.map((item) => item.toolName).filter(Boolean))
  );

  return {
    approvalSummary: {
      decisions: responses,
      hasPendingApprovals: pendingApprovals.length > 0,
      pendingApprovals,
      ...(pendingApprovals.length > 0 && state
        ? {
            serializedRunState: state.toString(),
          }
        : {}),
    },
    usedGuideIds: ["human-in-the-loop"],
    ...(usedToolNames.length > 0 ? { usedToolNames } : {}),
  };
}

export function assertOpenAiAgentsSdkDemoNoPendingApproval(
  messages: UIMessage[]
) {
  if (!hasOpenAiAgentsSdkDemoPendingApproval(messages)) {
    return;
  }

  if (hasOpenAiAgentsSdkDemoApprovalResponses(messages)) {
    return;
  }

  const latestMessage = messages.at(-1);

  if (latestMessage?.role === "user") {
    throw new OpenAiAgentsSdkDemoApprovalError(pendingApprovalMessage);
  }
}
