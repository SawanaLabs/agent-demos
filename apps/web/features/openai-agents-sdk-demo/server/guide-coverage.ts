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
      currentRunStatus: "not-started",
      id: "running-agents",
      implementationStatus: "not-started",
      label: "Running Agents",
      observable: "RunResult / StreamedRunResult",
      providerCapabilityStatus: "not-evaluated",
      sdkPrimitive: "run() / Runner",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/guides/running-agents/",
    },
    {
      currentRunStatus: "not-started",
      id: "streaming",
      implementationStatus: "not-started",
      label: "Streaming",
      observable: "RunStreamEvent",
      providerCapabilityStatus: "not-evaluated",
      sdkPrimitive: "stream events",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/guides/streaming/",
    },
    {
      currentRunStatus: "not-started",
      id: "agent-orchestration",
      implementationStatus: "not-started",
      label: "Agent Orchestration",
      observable: "Agent-as-tool invocation",
      providerCapabilityStatus: "not-evaluated",
      sdkPrimitive: "agent.asTool()",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/guides/multi-agent/",
    },
    {
      currentRunStatus: "not-started",
      id: "handoffs",
      implementationStatus: "not-started",
      label: "Handoffs",
      observable: "RunHandoffCallItem / RunHandoffOutputItem",
      providerCapabilityStatus: "not-evaluated",
      sdkPrimitive: "handoff()",
      sourceGuide: "https://openai.github.io/openai-agents-js/guides/handoffs/",
    },
    {
      currentRunStatus: "not-started",
      id: "results",
      implementationStatus: "not-started",
      label: "Results",
      observable: "finalOutput, history, newItems, state",
      providerCapabilityStatus: "not-evaluated",
      sdkPrimitive: "RunResult",
      sourceGuide: "https://openai.github.io/openai-agents-js/guides/results/",
    },
    {
      currentRunStatus: "not-started",
      id: "human-in-the-loop",
      implementationStatus: "not-started",
      label: "Human-in-the-loop",
      observable: "RunToolApprovalItem interruption",
      providerCapabilityStatus: "not-evaluated",
      sdkPrimitive: "interruptions / approval",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/guides/human-in-the-loop/",
    },
    {
      currentRunStatus: "not-started",
      id: "sessions",
      implementationStatus: "not-started",
      label: "Sessions",
      observable: "Session history",
      providerCapabilityStatus: "not-evaluated",
      sdkPrimitive: "MemorySession",
      sourceGuide: "https://openai.github.io/openai-agents-js/guides/sessions/",
    },
    {
      currentRunStatus: "not-started",
      id: "context",
      implementationStatus: "not-started",
      label: "Context Management",
      observable: "RunContext passed through tools and guardrails",
      providerCapabilityStatus: "not-evaluated",
      sdkPrimitive: "RunContext<T>",
      sourceGuide: "https://openai.github.io/openai-agents-js/guides/context/",
    },
    {
      currentRunStatus: "not-started",
      id: "mcp",
      implementationStatus: "not-started",
      label: "MCP",
      observable: "MCP tool list / call items",
      providerCapabilityStatus: "not-evaluated",
      sdkPrimitive: "MCPServer",
      sourceGuide: "https://openai.github.io/openai-agents-js/guides/mcp/",
    },
    {
      currentRunStatus: "not-started",
      id: "tracing",
      implementationStatus: "not-started",
      label: "Tracing",
      observable: "Trace id / span metadata",
      providerCapabilityStatus: "not-evaluated",
      sdkPrimitive: "tracing",
      sourceGuide: "https://openai.github.io/openai-agents-js/guides/tracing/",
    },
    {
      currentRunStatus: "not-started",
      id: "sandbox-agents",
      implementationStatus: "not-started",
      label: "Sandbox Agents",
      observable: "Sandbox agent lifecycle",
      providerCapabilityStatus: "not-evaluated",
      sdkPrimitive: "sandbox agents",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/guides/sandbox-agents/",
    },
    {
      currentRunStatus: "not-started",
      id: "extensions-ai-sdk",
      implementationStatus: "not-started",
      label: "AI SDK Extension",
      observable: "AI SDK UI message stream",
      providerCapabilityStatus: "not-evaluated",
      sdkPrimitive: "createAiSdkUiMessageStream()",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/extensions/ai-sdk/",
    },
  ];

export function getOpenAiAgentsSdkDemoGuideCoverage({
  isChatAvailable,
}: OpenAiAgentsSdkDemoGuideCoverageOptions): OpenAiAgentsSdkDemoGuideCoverage[] {
  return openAiAgentsSdkGuideCoverageRegistry.map((item) => {
    if (item.id === "agents" || item.id === "models") {
      return {
        ...item,
        currentRunStatus: isChatAvailable ? "ready" : "blocked",
        providerCapabilityStatus: isChatAvailable
          ? "available"
          : "setup-required",
      };
    }

    if (item.id === "tools") {
      return {
        ...item,
        currentRunStatus: isChatAvailable ? "ready" : "blocked",
        providerCapabilityStatus: isChatAvailable
          ? "available"
          : "setup-required",
      };
    }

    if (item.id === "guardrails") {
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
