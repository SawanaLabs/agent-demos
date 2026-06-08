import { beforeEach, expect, it } from "vitest";

import {
  createAiSdkUiMessageStreamMock,
  drainReadableStream,
  executeLatestUiMessageStream,
  importChatModule,
  resetOpenAiAgentsSdkDemoChatMocks,
  runMock,
} from "./chat-test-fixtures";

beforeEach(resetOpenAiAgentsSdkDemoChatMocks);

it("captures official stream events and returns a streaming summary to the UI", async () => {
  const { streamOpenAiAgentsSdkDemo } = await importChatModule();

  createAiSdkUiMessageStreamMock.mockImplementationOnce(
    (source: AsyncIterable<unknown>) =>
      new ReadableStream({
        async start(controller) {
          for await (const _event of source) {
            // Consume the observed stream so metadata can be collected.
          }

          controller.enqueue({
            finishReason: "stop",
            type: "finish",
          });
          controller.close();
        },
      })
  );
  runMock.mockResolvedValueOnce({
    completed: Promise.resolve(),
    lastResponseId: "resp_stream_123",
    newItems: [],
    async *[Symbol.asyncIterator]() {
      yield {
        agent: {
          name: "Research Memo Agent",
        },
        type: "agent_updated_stream_event",
      };
      yield {
        data: {
          type: "response.output_text.delta",
        },
        source: "openai-responses",
        type: "raw_model_stream_event",
      };
      yield {
        item: {
          rawItem: {
            type: "function_call",
          },
        },
        name: "tool_called",
        type: "run_item_stream_event",
      };
    },
  });

  await streamOpenAiAgentsSdkDemo(
    [
      {
        id: "u1",
        parts: [{ text: "Stream something useful.", type: "text" }],
        role: "user",
      },
    ],
    {
      AI_GATEWAY_API_KEY: "gateway-key",
    }
  );

  const { merge, mergedStream, write } = await executeLatestUiMessageStream();

  expect(merge).toHaveBeenCalledWith(expect.any(ReadableStream));
  expect(mergedStream).toBeInstanceOf(ReadableStream);
  await drainReadableStream(mergedStream as ReadableStream<unknown>);
  expect(write).toHaveBeenCalledWith({
    messageMetadata: expect.objectContaining({
      lastResponseId: "resp_stream_123",
      resultSummary: expect.objectContaining({
        hasResumableState: false,
        rawResponseCount: 0,
      }),
      sessionSummary: expect.objectContaining({
        sessionKind: "MemorySession",
        storageScope: "process-local",
      }),
      streamSummary: {
        agentNames: ["Research Memo Agent"],
        rawModelEventCount: 1,
        rawModelEventTypes: ["response.output_text.delta"],
        rawModelSources: ["openai-responses"],
        runItemEventCount: 1,
        runItemEventNames: ["tool_called"],
      },
      usedGuideIds: expect.arrayContaining([
        "running-agents",
        "streaming",
        "results",
        "sessions",
      ]),
    }),
    type: "message-metadata",
  });
});

async function readReadableStream(stream: ReadableStream<unknown>) {
  const reader = stream.getReader();
  const chunks: unknown[] = [];

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        return chunks;
      }

      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}

it("persists settled RunResult surfaces into result metadata after completion", async () => {
  const { streamOpenAiAgentsSdkDemo } = await importChatModule();

  runMock.mockResolvedValueOnce({
    activeAgent: {
      name: "Research Lead Agent",
    },
    completed: Promise.resolve(),
    finalOutput: {
      summary: "Tesla gross margin pressure remains the key open issue.",
    },
    history: [{ role: "user" }, { role: "assistant" }],
    interruptions: [],
    lastAgent: {
      name: "Research Lead Agent",
    },
    lastResponseId: "resp_results_123",
    newItems: [{ rawItem: { type: "message_output_item" } }],
    output: [{ type: "message_output_item" }],
    rawResponses: [{ id: "resp_raw_1", output: [] }],
    state: {
      usage: {
        inputTokens: 321,
        outputTokens: 123,
        requests: 2,
        totalTokens: 444,
      },
    },
  });

  await streamOpenAiAgentsSdkDemo(
    [
      {
        id: "u1",
        parts: [{ text: "Summarize Tesla margins.", type: "text" }],
        role: "user",
      },
    ],
    {
      AI_GATEWAY_API_KEY: "gateway-key",
    }
  );

  const { merge, mergedStream, write } = await executeLatestUiMessageStream();

  expect(merge).toHaveBeenCalledWith(expect.any(ReadableStream));
  expect(mergedStream).toBeInstanceOf(ReadableStream);
  await drainReadableStream(mergedStream as ReadableStream<unknown>);
  expect(write).toHaveBeenCalledWith({
    messageMetadata: expect.objectContaining({
      lastResponseId: "resp_results_123",
      resultSummary: {
        activeAgentName: "Research Lead Agent",
        finalOutputPreview:
          '{"summary":"Tesla gross margin pressure remains the key open issue."}',
        hasResumableState: true,
        historyLength: 2,
        inputTokens: 321,
        interruptionCount: 0,
        lastAgentName: "Research Lead Agent",
        newItemsCount: 1,
        outputCount: 1,
        outputTokens: 123,
        rawResponseCount: 1,
        requestCount: 2,
        totalTokens: 444,
      },
      sessionSummary: expect.objectContaining({
        sessionKind: "MemorySession",
        storageScope: "process-local",
      }),
      usedGuideIds: expect.arrayContaining([
        "running-agents",
        "results",
        "sessions",
      ]),
    }),
    type: "message-metadata",
  });
});

it("adds generated image files to the UI stream when image_generation completes", async () => {
  const { streamOpenAiAgentsSdkDemo } = await importChatModule();

  createAiSdkUiMessageStreamMock.mockReturnValueOnce(
    new ReadableStream({
      start(controller) {
        controller.enqueue({
          messageId: "message-1",
          type: "start",
        });
        controller.enqueue({
          dynamic: true,
          toolCallId: "ig_123",
          toolName: "image_generation",
          type: "tool-input-start",
        });
        controller.enqueue({
          finishReason: "stop",
          type: "finish",
        });
        controller.close();
      },
    })
  );
  runMock.mockResolvedValueOnce({
    completed: Promise.resolve(),
    newItems: [
      {
        rawItem: {
          id: "ig_123",
          result: "ZmFrZS1pbWFnZQ==",
          status: "completed",
          type: "image_generation_call",
        },
      },
    ],
  });

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

  const { mergedStream, write } = await executeLatestUiMessageStream();

  if (!mergedStream) {
    throw new Error("Expected image generation stream to be merged.");
  }

  await expect(readReadableStream(mergedStream)).resolves.toEqual([
    {
      messageId: "message-1",
      type: "start",
    },
    {
      dynamic: true,
      toolCallId: "ig_123",
      toolName: "image_generation",
      type: "tool-input-start",
    },
    {
      mediaType: "image/png",
      type: "file",
      url: "data:image/png;base64,ZmFrZS1pbWFnZQ==",
    },
    {
      finishReason: "stop",
      type: "finish",
    },
  ]);
  expect(write).toHaveBeenCalledWith({
    messageMetadata: expect.objectContaining({
      contextSummary: {
        defaultResearchTarget: "Tesla",
        latestUserPromptPreview: "生成一张图片，随机。",
        localContextKind: "RunContext",
        researchMode: "general",
        sessionId: "session_demo_1",
        sessionKind: "MemorySession",
      },
      resultSummary: {
        hasResumableState: false,
        historyLength: 0,
        inputTokens: 0,
        interruptionCount: 0,
        newItemsCount: 1,
        outputCount: 0,
        outputTokens: 0,
        rawResponseCount: 0,
        requestCount: 0,
        totalTokens: 0,
      },
      sessionSummary: expect.objectContaining({
        sessionKind: "MemorySession",
        storageScope: "process-local",
      }),
      usedGuideIds: expect.arrayContaining([
        "results",
        "context",
        "sessions",
        "tools",
      ]),
      usedToolNames: ["image_generation"],
    }),
    type: "message-metadata",
  });
});
