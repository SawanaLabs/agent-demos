import { beforeEach, expect, it } from "vitest";

import {
  drainReadableStream,
  executeLatestUiMessageStream,
  getLatestUiMessageStreamOptions,
  InputGuardrailTripwireTriggeredMock,
  importChatModule,
  OutputGuardrailTripwireTriggeredMock,
  resetOpenAiAgentsSdkDemoChatMocks,
  runMock,
} from "./chat-test-fixtures";

beforeEach(resetOpenAiAgentsSdkDemoChatMocks);

it("surfaces stream errors through the AI SDK UI error handler", async () => {
  const { streamOpenAiAgentsSdkDemo } = await importChatModule();

  runMock.mockResolvedValueOnce({
    completed: Promise.resolve(),
    inputGuardrailResults: [
      {
        guardrail: {
          name: "prompt_scope_guardrail",
          type: "input",
        },
      },
    ],
    lastResponseId: "resp_demo_123",
    newItems: [
      {
        rawItem: {
          name: "web_search_call",
          type: "hosted_tool_call",
        },
      },
    ],
    outputGuardrailResults: [
      {
        guardrail: {
          name: "investment_advice_guardrail",
          type: "output",
        },
      },
    ],
  });

  await streamOpenAiAgentsSdkDemo(
    [
      {
        id: "u1",
        parts: [{ text: "Trigger an error path.", type: "text" }],
        role: "user",
      },
    ],
    {
      AI_GATEWAY_API_KEY: "gateway-key",
    }
  );

  const { onError } = getLatestUiMessageStreamOptions();
  const { merge, mergedStream, write } = await executeLatestUiMessageStream();

  expect(merge).toHaveBeenCalledWith(expect.any(ReadableStream));
  expect(mergedStream).toBeInstanceOf(ReadableStream);
  await drainReadableStream(mergedStream as ReadableStream<unknown>);
  expect(write).toHaveBeenCalledWith({
    messageMetadata: expect.objectContaining({
      aiSdkExtensionSummary: {
        modelAdapterStatus: "not-used",
        uiBridgeStatus: "configured",
        usedBridgePrimitive: "createAiSdkUiMessageStream()",
      },
      lastResponseId: "resp_demo_123",
      resultSummary: expect.objectContaining({
        hasResumableState: false,
        newItemsCount: 1,
        rawResponseCount: 0,
      }),
      sessionSummary: expect.objectContaining({
        historyItemCount: 0,
        sessionKind: "MemorySession",
        storageScope: "process-local",
      }),
      traceSummary: expect.objectContaining({
        exportApiKeySource: "missing",
        groupId: "session_demo_1",
        metadataKeys: ["demo", "session_id"],
        traceId: "trace_demo_1234567890abcdef1234567890ab",
        traceIncludeSensitiveData: true,
        tracingDisabled: false,
        workflowName: "openai-agents-sdk-demo",
      }),
      usedGuideIds: expect.arrayContaining([
        "running-agents",
        "results",
        "sessions",
        "tracing",
        "tools",
        "guardrails",
        "extensions-ai-sdk",
      ]),
      usedGuardrailNames: [
        "prompt_scope_guardrail",
        "investment_advice_guardrail",
      ],
      usedToolNames: ["web_search"],
    }),
    type: "message-metadata",
  });
  expect(onError(new Error("Model 'openai/gpt-5.4-mini' not found"))).toContain(
    "Model 'openai/gpt-5.4-mini' not found"
  );
  expect(
    onError(new Error("400 At least one user message is required in the input"))
  ).toContain(
    "AI Gateway rejected the OpenAI Agents SDK function-tool continuation request"
  );
  expect(onError("plain-string-error")).toBe("The agent stream failed.");
});

it("maps terminated image-generation streams to an explicit provider block", async () => {
  const { streamOpenAiAgentsSdkDemo } = await importChatModule();

  await streamOpenAiAgentsSdkDemo(
    [
      {
        id: "u1",
        parts: [{ text: "生成一张图片，随机。", type: "text" }],
        role: "user",
      },
    ],
    {
      AI_GATEWAY_API_KEY: "gateway-key",
    }
  );

  const { onError } = getLatestUiMessageStreamOptions();

  expect(onError(new Error("terminated"))).toContain(
    "image generation is blocked"
  );
});

it("maps guardrail tripwires to explicit chat errors", async () => {
  const { streamOpenAiAgentsSdkDemo } = await importChatModule();

  await streamOpenAiAgentsSdkDemo(
    [
      {
        id: "u1",
        parts: [{ text: "Trigger a guardrail path.", type: "text" }],
        role: "user",
      },
    ],
    {
      AI_GATEWAY_API_KEY: "gateway-key",
    }
  );

  const { onError } = getLatestUiMessageStreamOptions();

  expect(
    onError(
      new InputGuardrailTripwireTriggeredMock("blocked", {
        guardrail: {
          name: "prompt_scope_guardrail",
          type: "input",
        },
      })
    )
  ).toContain('Input guardrail "prompt_scope_guardrail" blocked the request');
  expect(
    onError(
      new OutputGuardrailTripwireTriggeredMock("blocked", {
        guardrail: {
          name: "investment_advice_guardrail",
          type: "output",
        },
      })
    )
  ).toContain(
    'Output guardrail "investment_advice_guardrail" blocked the response'
  );
});
