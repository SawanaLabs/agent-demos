import { generateTraceId } from "@openai/agents";
import type { UIMessage } from "ai";
import { z } from "zod";

import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";

type DemoEnv = Record<string, string | undefined>;

const traceDisableEnvVar = "OPENAI_AGENTS_DISABLE_TRACING";
const traceSensitiveDataEnvVar = "OPENAI_AGENTS_TRACE_INCLUDE_SENSITIVE_DATA";
const traceApiKeyEnvVar = "OPENAI_AGENTS_TRACING_API_KEY";
const openAiApiKeyEnvVar = "OPENAI_API_KEY";

export const openAiAgentsSdkDemoTraceSummarySchema = z.object({
  exportApiKeySource: z.enum([
    "OPENAI_AGENTS_TRACING_API_KEY",
    "OPENAI_API_KEY",
    "missing",
  ]),
  groupId: z.string().optional(),
  metadataKeys: z.array(z.string()),
  traceId: z.string(),
  traceIncludeSensitiveData: z.boolean(),
  tracingDisabled: z.boolean(),
  workflowName: z.string(),
});

export interface OpenAiAgentsSdkDemoTraceProfile {
  defaultServerRuntimeTracing: "enabled";
  disableEnvVar: typeof traceDisableEnvVar;
  exportApiKeySource:
    | "OPENAI_AGENTS_TRACING_API_KEY"
    | "OPENAI_API_KEY"
    | "missing";
  groupingStrategy: "session-id";
  sdkPrimitives: [
    "generateTraceId",
    "run({ workflowName, traceId, groupId, traceMetadata, tracingDisabled, traceIncludeSensitiveData, tracing })",
  ];
  traceIncludeSensitiveData: boolean;
  tracingDisabled: boolean;
  usesPerRunExportOverride: true;
  workflowNameSource: "RunConfig.workflowName";
}

function getTracingExportApiKeySource(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoTraceProfile["exportApiKeySource"] {
  if (env[traceApiKeyEnvVar]) {
    return traceApiKeyEnvVar;
  }

  if (env[openAiApiKeyEnvVar]) {
    return openAiApiKeyEnvVar;
  }

  return "missing";
}

function getTracingExportApiKey(env: DemoEnv = process.env) {
  return env[traceApiKeyEnvVar] ?? env[openAiApiKeyEnvVar] ?? undefined;
}

function isTracingDisabled(env: DemoEnv = process.env) {
  return env[traceDisableEnvVar] === "1";
}

function shouldIncludeSensitiveData(env: DemoEnv = process.env) {
  return env[traceSensitiveDataEnvVar] !== "0";
}

function getLatestAssistantTraceSummary(messages: UIMessage[]) {
  return ([...messages].reverse().find((message) => message.role === "assistant")
    ?.metadata as OpenAiAgentsSdkDemoMessageMetadata | undefined)?.traceSummary;
}

export function getOpenAiAgentsSdkDemoTraceProfile(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoTraceProfile {
  return {
    defaultServerRuntimeTracing: "enabled",
    disableEnvVar: traceDisableEnvVar,
    exportApiKeySource: getTracingExportApiKeySource(env),
    groupingStrategy: "session-id",
    sdkPrimitives: [
      "generateTraceId",
      "run({ workflowName, traceId, groupId, traceMetadata, tracingDisabled, traceIncludeSensitiveData, tracing })",
    ],
    traceIncludeSensitiveData: shouldIncludeSensitiveData(env),
    tracingDisabled: isTracingDisabled(env),
    usesPerRunExportOverride: true,
    workflowNameSource: "RunConfig.workflowName",
  };
}

export function createOpenAiAgentsSdkDemoTraceRunConfig({
  env = process.env,
  sessionId,
  workflowName,
}: {
  env?: DemoEnv;
  sessionId?: string;
  workflowName: string;
}) {
  const exportApiKey = getTracingExportApiKey(env);
  const summary = {
    exportApiKeySource: getTracingExportApiKeySource(env),
    ...(sessionId ? { groupId: sessionId } : {}),
    metadataKeys: ["demo", "session_id"],
    traceId: generateTraceId(),
    traceIncludeSensitiveData: shouldIncludeSensitiveData(env),
    tracingDisabled: isTracingDisabled(env),
    workflowName,
  } satisfies z.infer<typeof openAiAgentsSdkDemoTraceSummarySchema>;

  return {
    options: {
      ...(sessionId ? { groupId: sessionId } : {}),
      traceId: summary.traceId,
      traceIncludeSensitiveData: summary.traceIncludeSensitiveData,
      traceMetadata: {
        demo: "openai-agents-sdk-demo",
        session_id: sessionId ?? "unknown",
      },
      tracingDisabled: summary.tracingDisabled,
      ...(exportApiKey ? { tracing: { apiKey: exportApiKey } } : {}),
      workflowName: summary.workflowName,
    },
    summary,
  };
}

export function getOpenAiAgentsSdkDemoTraceUsageMetadata(
  summary:
    | z.infer<typeof openAiAgentsSdkDemoTraceSummarySchema>
    | undefined
) {
  if (!summary) {
    return undefined;
  }

  return {
    traceSummary: summary,
    usedGuideIds: ["tracing"],
  } satisfies OpenAiAgentsSdkDemoMessageMetadata;
}

export function getOpenAiAgentsSdkDemoLatestTraceUsageMetadata(
  messages: UIMessage[]
) {
  return getOpenAiAgentsSdkDemoTraceUsageMetadata(
    getLatestAssistantTraceSummary(messages)
  );
}
