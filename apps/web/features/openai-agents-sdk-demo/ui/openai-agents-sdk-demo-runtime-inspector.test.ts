import { describe, expect, it } from "vitest";

import type { OpenAiAgentsSdkDemoMessage } from "../message-metadata";
import { getOpenAiAgentsSdkDemoAiSdkExtensionProfile } from "../server/extensions";
import type { OpenAiAgentsSdkDemoGuideCoverage } from "../server/guide-coverage";
import { getOpenAiAgentsSdkDemoTraceProfile } from "../server/tracing";
import { buildOpenAiAgentsSdkDemoRuntimeInspector } from "./openai-agents-sdk-demo-runtime-inspector";

const baseGuideCoverage: OpenAiAgentsSdkDemoGuideCoverage[] = [
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
    id: "tools",
    implementationStatus: "implemented",
    label: "Tools",
    observable: "RunToolCallItem",
    providerCapabilityStatus: "available",
    sdkPrimitive: "tool()",
    sourceGuide: "https://openai.github.io/openai-agents-js/guides/tools/",
  },
  {
    currentRunStatus: "blocked",
    id: "voice-agents",
    implementationStatus: "implemented",
    label: "Voice Agents",
    observable: "RealtimeSession",
    providerCapabilityStatus: "setup-required",
    sdkPrimitive: "RealtimeAgent",
    sourceGuide:
      "https://openai.github.io/openai-agents-js/guides/voice-agents/",
  },
];

describe("openai agents sdk demo runtime inspector", () => {
  it("derives current-run inspector state from assistant message metadata", () => {
    const messages: OpenAiAgentsSdkDemoMessage[] = [
      {
        id: "u1",
        parts: [{ text: "Use tools for this run.", type: "text" }],
        role: "user",
      },
      {
        id: "a1",
        metadata: {
          aiSdkExtensionSummary: {
            modelAdapterStatus: "not-used",
            uiBridgeStatus: "configured",
            usedBridgePrimitive: "createAiSdkUiMessageStream()",
          },
          approvalSummary: {
            decisions: [],
            hasPendingApprovals: true,
            pendingApprovals: [
              {
                approvalId: "approval_1",
                toolCallId: "call_1",
                toolName: "publish_research_summary",
              },
            ],
            serializedRunState: "state-json",
          },
          streamSummary: {
            agentNames: ["research_agent"],
            rawModelEventCount: 2,
            rawModelEventTypes: ["response_started"],
            rawModelSources: ["openai-responses"],
            runItemEventCount: 1,
            runItemEventNames: ["tool_call_item"],
          },
          traceSummary: {
            exportApiKeySource: "OPENAI_API_KEY",
            groupId: "group_1",
            metadataKeys: ["demo"],
            traceId: "trace_1",
            traceIncludeSensitiveData: true,
            tracingDisabled: false,
            workflowName: "OpenAI Agents SDK Demo",
          },
          usedGuideIds: ["tools"],
          usedGuardrailNames: ["investment_advice_guardrail"],
          usedToolNames: ["publish_research_summary"],
        },
        parts: [{ text: "Tool approval required.", type: "text" }],
        role: "assistant",
      },
    ];

    const inspector = buildOpenAiAgentsSdkDemoRuntimeInspector({
      aiSdkExtensionProfile: getOpenAiAgentsSdkDemoAiSdkExtensionProfile(),
      guideCoverage: baseGuideCoverage,
      hasUsedVoiceGuide: true,
      messages,
      traceProfile: getOpenAiAgentsSdkDemoTraceProfile({}),
    });

    expect(inspector.hasPendingApproval).toBe(true);
    expect(inspector.aiSdkUiBridgeStatus).toBe("configured");
    expect(inspector.aiSdkModelAdapterStatus).toBe("not-used");
    expect(inspector.traceIncludesSensitiveData).toBe(true);
    expect(inspector.usedToolNames.has("publish_research_summary")).toBe(true);
    expect(
      inspector.usedGuardrailNames.has("investment_advice_guardrail")
    ).toBe(true);
    expect(inspector.lastStreamSummary?.runItemEventCount).toBe(1);
    expect(inspector.lastTraceSummary?.traceId).toBe("trace_1");
    expect(
      inspector.guideCoverageWithCurrentRun.map((item) => [
        item.id,
        item.currentRunStatus,
      ])
    ).toEqual([
      ["agents", "used-this-run"],
      ["tools", "used-this-run"],
      ["voice-agents", "used-this-run"],
    ]);
  });
});
