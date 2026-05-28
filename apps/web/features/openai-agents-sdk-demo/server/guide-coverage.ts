export type OpenAiAgentsSdkGuideImplementationStatus =
  | "blocked"
  | "implemented"
  | "not-started";

export type OpenAiAgentsSdkGuideRunStatus =
  | "blocked"
  | "not-started"
  | "ready"
  | "used-this-run";

export type OpenAiAgentsSdkProviderCapabilityStatus =
  | "available"
  | "not-evaluated"
  | "setup-required";

export interface OpenAiAgentsSdkDemoGuideCoverage {
  currentRunStatus: OpenAiAgentsSdkGuideRunStatus;
  id: string;
  implementationStatus: OpenAiAgentsSdkGuideImplementationStatus;
  label: string;
  observable: string;
  providerCapabilityStatus: OpenAiAgentsSdkProviderCapabilityStatus;
  sdkPrimitive: string;
  sourceGuide: string;
}

interface OpenAiAgentsSdkDemoGuideCoverageOptions {
  isChatAvailable: boolean;
  isVoiceProviderAvailable: boolean;
}

const openAiAgentsSdkGuideCoverageRegistry: OpenAiAgentsSdkDemoGuideCoverage[] =
  [
    {
      currentRunStatus: "ready",
      id: "agents",
      implementationStatus: "implemented",
      label: "Agents",
      observable: "Agent instance passed to run()",
      providerCapabilityStatus: "available",
      sdkPrimitive: "Agent",
      sourceGuide: "https://openai.github.io/openai-agents-js/guides/agents/",
    },
    {
      currentRunStatus: "ready",
      id: "models",
      implementationStatus: "implemented",
      label: "Models",
      observable:
        "Agent modelSettings.reasoning + text.verbosity on the responses API path",
      providerCapabilityStatus: "available",
      sdkPrimitive: "model, modelSettings",
      sourceGuide: "https://openai.github.io/openai-agents-js/guides/models/",
    },
    {
      currentRunStatus: "ready",
      id: "tools",
      implementationStatus: "implemented",
      label: "Tools",
      observable: "RunToolCallItem / RunToolCallOutputItem",
      providerCapabilityStatus: "available",
      sdkPrimitive: "tool()",
      sourceGuide: "https://openai.github.io/openai-agents-js/guides/tools/",
    },
    {
      currentRunStatus: "ready",
      id: "guardrails",
      implementationStatus: "implemented",
      label: "Guardrails",
      observable: "Guardrail tripwire result",
      providerCapabilityStatus: "available",
      sdkPrimitive: "inputGuardrails / outputGuardrails",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/guides/guardrails/",
    },
    {
      currentRunStatus: "ready",
      id: "running-agents",
      implementationStatus: "implemented",
      label: "Running Agents",
      observable:
        "run() + previousResponseId / MemorySession continuation + maxTurns + AbortSignal",
      providerCapabilityStatus: "available",
      sdkPrimitive: "run()",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/guides/running-agents/",
    },
    {
      currentRunStatus: "ready",
      id: "streaming",
      implementationStatus: "implemented",
      label: "Streaming",
      observable:
        "RunStreamEvent metadata from raw_model_stream_event, run_item_stream_event, and agent_updated_stream_event",
      providerCapabilityStatus: "available",
      sdkPrimitive: "RunStreamEvent",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/guides/streaming/",
    },
    {
      currentRunStatus: "ready",
      id: "agent-orchestration",
      implementationStatus: "implemented",
      label: "Agent Orchestration",
      observable: "agent.asTool() invocation through a specialist sub-agent",
      providerCapabilityStatus: "available",
      sdkPrimitive: "agent.asTool()",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/guides/multi-agent/",
    },
    {
      currentRunStatus: "ready",
      id: "handoffs",
      implementationStatus: "implemented",
      label: "Handoffs",
      observable: "RunHandoffCallItem / RunHandoffOutputItem",
      providerCapabilityStatus: "available",
      sdkPrimitive: "handoff()",
      sourceGuide: "https://openai.github.io/openai-agents-js/guides/handoffs/",
    },
    {
      currentRunStatus: "ready",
      id: "results",
      implementationStatus: "implemented",
      label: "Results",
      observable: "finalOutput, history, newItems, state",
      providerCapabilityStatus: "available",
      sdkPrimitive: "RunResult",
      sourceGuide: "https://openai.github.io/openai-agents-js/guides/results/",
    },
    {
      currentRunStatus: "ready",
      id: "human-in-the-loop",
      implementationStatus: "implemented",
      label: "Human-in-the-loop",
      observable: "RunToolApprovalItem interruption",
      providerCapabilityStatus: "available",
      sdkPrimitive: "interruptions / approval",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/guides/human-in-the-loop/",
    },
    {
      currentRunStatus: "ready",
      id: "sessions",
      implementationStatus: "implemented",
      label: "Sessions",
      observable: "MemorySession history + assistant metadata session id",
      providerCapabilityStatus: "available",
      sdkPrimitive: "MemorySession",
      sourceGuide: "https://openai.github.io/openai-agents-js/guides/sessions/",
    },
    {
      currentRunStatus: "ready",
      id: "context",
      implementationStatus: "implemented",
      label: "Context Management",
      observable:
        "RunContext through run(), dynamic instructions, tools, and guardrails",
      providerCapabilityStatus: "available",
      sdkPrimitive: "RunContext<T>",
      sourceGuide: "https://openai.github.io/openai-agents-js/guides/context/",
    },
    {
      currentRunStatus: "ready",
      id: "mcp",
      implementationStatus: "implemented",
      label: "MCP",
      observable:
        "MCP server connection state + server-prefixed MCP tool call items",
      providerCapabilityStatus: "available",
      sdkPrimitive: "MCPServerStreamableHttp / connectMcpServers",
      sourceGuide: "https://openai.github.io/openai-agents-js/guides/mcp/",
    },
    {
      currentRunStatus: "ready",
      id: "tracing",
      implementationStatus: "implemented",
      label: "Tracing",
      observable:
        "workflowName + traceId + groupId + traceMetadata + tracingDisabled",
      providerCapabilityStatus: "available",
      sdkPrimitive: "traceId / groupId / RunConfig.tracing",
      sourceGuide: "https://openai.github.io/openai-agents-js/guides/tracing/",
    },
    {
      currentRunStatus: "ready",
      id: "sandbox-agents",
      implementationStatus: "implemented",
      label: "Sandbox Agents",
      observable:
        "SandboxAgent lifecycle + RunConfig.sandbox + persisted sandbox session state",
      providerCapabilityStatus: "available",
      sdkPrimitive: "SandboxAgent / RunConfig.sandbox",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/guides/sandbox-agents/",
    },
    {
      currentRunStatus: "ready",
      id: "voice-agents",
      implementationStatus: "implemented",
      label: "Voice Agents",
      observable:
        "RealtimeSession.connect({ apiKey }) over WebRTC plus visible browser microphone controls",
      providerCapabilityStatus: "setup-required",
      sdkPrimitive: "RealtimeAgent / RealtimeSession",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/guides/voice-agents/",
    },
    {
      currentRunStatus: "ready",
      id: "extensions-ai-sdk",
      implementationStatus: "implemented",
      label: "AI SDK Extension",
      observable:
        "AI SDK UI stream from createAiSdkUiMessageStream(); aisdk(model) adapter boundary is explicit",
      providerCapabilityStatus: "available",
      sdkPrimitive: "createAiSdkUiMessageStream() / aisdk(model)",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/extensions/ai-sdk/",
    },
  ];

const openAiAgentsSdkChatRunGatedGuideIds = new Set([
  "agents",
  "models",
  "tools",
  "guardrails",
  "running-agents",
  "streaming",
  "agent-orchestration",
  "handoffs",
  "results",
  "human-in-the-loop",
  "sessions",
  "context",
  "mcp",
  "tracing",
  "sandbox-agents",
  "extensions-ai-sdk",
]);

export function getOpenAiAgentsSdkDemoGuideCoverage({
  isChatAvailable,
  isVoiceProviderAvailable,
}: OpenAiAgentsSdkDemoGuideCoverageOptions): OpenAiAgentsSdkDemoGuideCoverage[] {
  return openAiAgentsSdkGuideCoverageRegistry.map((item) => {
    if (item.id === "voice-agents") {
      return {
        ...item,
        currentRunStatus: isVoiceProviderAvailable ? "ready" : "blocked",
        providerCapabilityStatus: isVoiceProviderAvailable
          ? "available"
          : "setup-required",
      };
    }

    if (openAiAgentsSdkChatRunGatedGuideIds.has(item.id)) {
      return {
        ...item,
        currentRunStatus: isChatAvailable ? "ready" : "blocked",
        providerCapabilityStatus: isChatAvailable
          ? "available"
          : "setup-required",
      };
    }

    return item;
  });
}
