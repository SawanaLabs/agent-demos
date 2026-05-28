import { describe, expect, it } from "vitest";

import {
  createOpenAiAgentsSdkDemoTraceRunConfig,
  getOpenAiAgentsSdkDemoLatestTraceUsageMetadata,
  getOpenAiAgentsSdkDemoTraceProfile,
} from "./tracing";

describe("openai agents sdk demo tracing", () => {
  it("builds explicit per-run tracing config from official RunConfig fields", () => {
    const traceRunConfig = createOpenAiAgentsSdkDemoTraceRunConfig({
      env: {
        OPENAI_AGENTS_TRACE_INCLUDE_SENSITIVE_DATA: "0",
        OPENAI_AGENTS_TRACING_API_KEY: "trace-key",
      },
      sessionId: "session_demo_1",
      workflowName: "openai-agents-sdk-demo",
    });

    expect(traceRunConfig.summary).toMatchObject({
      exportApiKeySource: "OPENAI_AGENTS_TRACING_API_KEY",
      groupId: "session_demo_1",
      metadataKeys: ["demo", "session_id"],
      traceIncludeSensitiveData: false,
      tracingDisabled: false,
      workflowName: "openai-agents-sdk-demo",
    });
    expect(traceRunConfig.summary.traceId).toMatch(/^trace_[A-Za-z0-9]{32}$/);
    expect(traceRunConfig.options).toMatchObject({
      groupId: "session_demo_1",
      traceIncludeSensitiveData: false,
      traceMetadata: {
        demo: "openai-agents-sdk-demo",
        session_id: "session_demo_1",
      },
      tracing: {
        apiKey: "trace-key",
      },
      tracingDisabled: false,
      workflowName: "openai-agents-sdk-demo",
    });
    expect(traceRunConfig.options.traceId).toMatch(/^trace_[A-Za-z0-9]{32}$/);
  });

  it("reuses the latest assistant trace summary when resuming a paused run", () => {
    expect(
      getOpenAiAgentsSdkDemoLatestTraceUsageMetadata([
        {
          id: "assistant_1",
          metadata: {
            traceSummary: {
              exportApiKeySource: "missing",
              groupId: "session_demo_1",
              metadataKeys: ["demo", "session_id"],
              traceId: "trace_1234567890abcdef1234567890abcd",
              traceIncludeSensitiveData: true,
              tracingDisabled: false,
              workflowName: "openai-agents-sdk-demo",
            },
          },
          parts: [{ text: "Approve the tool call.", type: "text" }],
          role: "assistant",
        },
      ])
    ).toEqual({
      traceSummary: {
        exportApiKeySource: "missing",
        groupId: "session_demo_1",
        metadataKeys: ["demo", "session_id"],
        traceId: "trace_1234567890abcdef1234567890abcd",
        traceIncludeSensitiveData: true,
        tracingDisabled: false,
        workflowName: "openai-agents-sdk-demo",
      },
      usedGuideIds: ["tracing"],
    });
  });

  it("exposes the visible tracing runtime profile", () => {
    expect(
      getOpenAiAgentsSdkDemoTraceProfile({
        OPENAI_API_KEY: "openai-key",
        OPENAI_AGENTS_DISABLE_TRACING: "1",
      })
    ).toEqual({
      defaultServerRuntimeTracing: "enabled",
      disableEnvVar: "OPENAI_AGENTS_DISABLE_TRACING",
      exportApiKeySource: "OPENAI_API_KEY",
      groupingStrategy: "session-id",
      sdkPrimitives: [
        "generateTraceId",
        "run({ workflowName, traceId, groupId, traceMetadata, tracingDisabled, traceIncludeSensitiveData, tracing })",
      ],
      traceIncludeSensitiveData: true,
      tracingDisabled: true,
      usesPerRunExportOverride: true,
      workflowNameSource: "RunConfig.workflowName",
    });
  });
});
