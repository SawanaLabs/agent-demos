import type { UIMessage } from "ai";
import { z } from "zod";

import { openAiAgentsSdkDemoApprovalSummarySchema } from "./server/approvals";
import { openAiAgentsSdkDemoContextSummarySchema } from "./server/context";
import { openAiAgentsSdkDemoAiSdkExtensionSummarySchema } from "./server/extensions";
import { openAiAgentsSdkDemoMcpSummarySchema } from "./server/mcp";
import { openAiAgentsSdkDemoSandboxSummarySchema } from "./server/sandbox";
import { openAiAgentsSdkDemoSessionSummarySchema } from "./server/sessions";
import { openAiAgentsSdkDemoTraceSummarySchema } from "./server/tracing";

export const openAiAgentsSdkDemoStreamSummarySchema = z.object({
  agentNames: z.array(z.string()),
  rawModelEventCount: z.number().int().nonnegative(),
  rawModelEventTypes: z.array(z.string()),
  rawModelSources: z.array(z.string()),
  runItemEventCount: z.number().int().nonnegative(),
  runItemEventNames: z.array(z.string()),
});

export const openAiAgentsSdkDemoHandoffSummarySchema = z.object({
  activeAgentName: z.string().optional(),
  handoffTargetNames: z.array(z.string()),
  handoffTransitions: z.array(z.string()),
});

export const openAiAgentsSdkDemoResultSummarySchema = z.object({
  activeAgentName: z.string().optional(),
  finalOutputPreview: z.string().optional(),
  hasResumableState: z.boolean(),
  historyLength: z.number().int().nonnegative(),
  inputTokens: z.number().int().nonnegative(),
  interruptionCount: z.number().int().nonnegative(),
  lastAgentName: z.string().optional(),
  newItemsCount: z.number().int().nonnegative(),
  outputCount: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  rawResponseCount: z.number().int().nonnegative(),
  requestCount: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
});

export const openAiAgentsSdkDemoMessageMetadataSchema = z.object({
  aiSdkExtensionSummary:
    openAiAgentsSdkDemoAiSdkExtensionSummarySchema.optional(),
  approvalSummary: openAiAgentsSdkDemoApprovalSummarySchema.optional(),
  contextSummary: openAiAgentsSdkDemoContextSummarySchema.optional(),
  handoffSummary: openAiAgentsSdkDemoHandoffSummarySchema.optional(),
  lastResponseId: z.string().optional(),
  mcpSummary: openAiAgentsSdkDemoMcpSummarySchema.optional(),
  resultSummary: openAiAgentsSdkDemoResultSummarySchema.optional(),
  sandboxSummary: openAiAgentsSdkDemoSandboxSummarySchema.optional(),
  sessionSummary: openAiAgentsSdkDemoSessionSummarySchema.optional(),
  streamSummary: openAiAgentsSdkDemoStreamSummarySchema.optional(),
  traceSummary: openAiAgentsSdkDemoTraceSummarySchema.optional(),
  usedGuardrailNames: z.array(z.string()).optional(),
  usedGuideIds: z.array(z.string()).optional(),
  usedToolNames: z.array(z.string()).optional(),
});

export type OpenAiAgentsSdkDemoMessageMetadata = z.infer<
  typeof openAiAgentsSdkDemoMessageMetadataSchema
>;

export type OpenAiAgentsSdkDemoMessage =
  UIMessage<OpenAiAgentsSdkDemoMessageMetadata>;
