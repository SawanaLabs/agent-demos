import type {
  OpenAiAgentsSdkDemoMessage,
  OpenAiAgentsSdkDemoMessageMetadata,
} from "@/lib/openai-agents-sdk-demo/message-metadata";
import type { OpenAiAgentsSdkDemoAiSdkExtensionProfile } from "@/lib/openai-agents-sdk-demo/server/extensions";
import type { OpenAiAgentsSdkDemoGuideCoverage } from "@/lib/openai-agents-sdk-demo/server/guide-coverage";
import type { OpenAiAgentsSdkDemoTraceProfile } from "@/lib/openai-agents-sdk-demo/server/tracing";
import { hasOpenAiAgentsSdkDemoVisibleContent } from "./openai-agents-sdk-demo-session";

type MetadataKey = keyof OpenAiAgentsSdkDemoMessageMetadata;

export interface OpenAiAgentsSdkDemoRuntimeInspectorInput {
  aiSdkExtensionProfile: OpenAiAgentsSdkDemoAiSdkExtensionProfile;
  guideCoverage: OpenAiAgentsSdkDemoGuideCoverage[];
  hasUsedVoiceGuide: boolean;
  messages: OpenAiAgentsSdkDemoMessage[];
  traceProfile: OpenAiAgentsSdkDemoTraceProfile;
}

export interface OpenAiAgentsSdkDemoRuntimeInspector {
  aiSdkModelAdapterStatus: string;
  aiSdkUiBridgeStatus: string;
  guideCoverageWithCurrentRun: OpenAiAgentsSdkDemoGuideCoverage[];
  hasPendingApproval: boolean;
  lastAiSdkExtensionSummary?: OpenAiAgentsSdkDemoMessageMetadata["aiSdkExtensionSummary"];
  lastApprovalSummary?: OpenAiAgentsSdkDemoMessageMetadata["approvalSummary"];
  lastContextSummary?: OpenAiAgentsSdkDemoMessageMetadata["contextSummary"];
  lastHandoffSummary?: OpenAiAgentsSdkDemoMessageMetadata["handoffSummary"];
  lastMcpSummary?: OpenAiAgentsSdkDemoMessageMetadata["mcpSummary"];
  lastResponseId?: string;
  lastResultSummary?: OpenAiAgentsSdkDemoMessageMetadata["resultSummary"];
  lastSandboxSummary?: OpenAiAgentsSdkDemoMessageMetadata["sandboxSummary"];
  lastSessionSummary?: OpenAiAgentsSdkDemoMessageMetadata["sessionSummary"];
  lastStreamSummary?: OpenAiAgentsSdkDemoMessageMetadata["streamSummary"];
  lastTraceSummary?: OpenAiAgentsSdkDemoMessageMetadata["traceSummary"];
  traceIncludesSensitiveData: boolean;
  usedGuardrailNames: Set<string>;
  usedGuideIds: Set<string>;
  usedToolNames: Set<string>;
}

function getLatestAssistantMessage(messages: OpenAiAgentsSdkDemoMessage[]) {
  return [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
}

function getLatestAssistantMetadata<K extends MetadataKey>(
  messages: OpenAiAgentsSdkDemoMessage[],
  key: K
) {
  return [...messages]
    .reverse()
    .find((message) => message.role === "assistant" && message.metadata?.[key])
    ?.metadata?.[key];
}

export function buildOpenAiAgentsSdkDemoRuntimeInspector({
  aiSdkExtensionProfile,
  guideCoverage,
  hasUsedVoiceGuide,
  messages,
  traceProfile,
}: OpenAiAgentsSdkDemoRuntimeInspectorInput): OpenAiAgentsSdkDemoRuntimeInspector {
  const hasAssistantOutput = messages.some(
    (message) =>
      message.role === "assistant" &&
      hasOpenAiAgentsSdkDemoVisibleContent(message)
  );
  const usedGuideIds = new Set(
    messages.flatMap((message) => message.metadata?.usedGuideIds ?? [])
  );
  const usedToolNames = new Set(
    messages.flatMap((message) => message.metadata?.usedToolNames ?? [])
  );
  const usedGuardrailNames = new Set(
    messages.flatMap((message) => message.metadata?.usedGuardrailNames ?? [])
  );
  const lastAiSdkExtensionSummary = getLatestAssistantMetadata(
    messages,
    "aiSdkExtensionSummary"
  );
  const lastApprovalSummary = getLatestAssistantMetadata(
    messages,
    "approvalSummary"
  );
  const lastTraceSummary = getLatestAssistantMetadata(messages, "traceSummary");
  const guideCoverageWithCurrentRun = guideCoverage.map((item) => {
    const wasUsedThisRun =
      ((item.id === "agents" || item.id === "models") && hasAssistantOutput) ||
      usedGuideIds.has(item.id) ||
      (item.id === "voice-agents" && hasUsedVoiceGuide);

    if (!wasUsedThisRun) {
      return item;
    }

    return {
      ...item,
      currentRunStatus: "used-this-run" as const,
    };
  });

  return {
    aiSdkModelAdapterStatus:
      lastAiSdkExtensionSummary?.modelAdapterStatus ??
      aiSdkExtensionProfile.modelAdapter.status,
    aiSdkUiBridgeStatus:
      lastAiSdkExtensionSummary?.uiBridgeStatus ??
      aiSdkExtensionProfile.uiBridge.status,
    guideCoverageWithCurrentRun,
    hasPendingApproval: Boolean(lastApprovalSummary?.hasPendingApprovals),
    lastAiSdkExtensionSummary,
    lastApprovalSummary,
    lastContextSummary: getLatestAssistantMetadata(messages, "contextSummary"),
    lastHandoffSummary: getLatestAssistantMetadata(messages, "handoffSummary"),
    lastMcpSummary: getLatestAssistantMetadata(messages, "mcpSummary"),
    lastResponseId:
      getLatestAssistantMessage(messages)?.metadata?.lastResponseId,
    lastResultSummary: getLatestAssistantMetadata(messages, "resultSummary"),
    lastSandboxSummary: getLatestAssistantMetadata(messages, "sandboxSummary"),
    lastSessionSummary: getLatestAssistantMetadata(messages, "sessionSummary"),
    lastStreamSummary: getLatestAssistantMetadata(messages, "streamSummary"),
    lastTraceSummary,
    traceIncludesSensitiveData:
      lastTraceSummary?.traceIncludeSensitiveData ??
      traceProfile.traceIncludeSensitiveData,
    usedGuardrailNames,
    usedGuideIds,
    usedToolNames,
  };
}
