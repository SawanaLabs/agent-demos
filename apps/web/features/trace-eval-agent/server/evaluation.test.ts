import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createAiGatewayMock,
  generateTextMock,
  getAiGatewayConfigMock,
  getAiGatewaySetupStateMock,
  outputObjectMock,
  streamTextMock,
} = vi.hoisted(() => ({
  createAiGatewayMock: vi.fn(),
  generateTextMock: vi.fn(),
  getAiGatewayConfigMock: vi.fn(),
  getAiGatewaySetupStateMock: vi.fn(),
  outputObjectMock: vi.fn(),
  streamTextMock: vi.fn(),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();

  return {
    ...actual,
    generateText: generateTextMock,
    streamText: streamTextMock,
    Output: {
      ...actual.Output,
      object: outputObjectMock,
    },
  };
});

vi.mock("./env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./env")>();

  return {
    ...actual,
    createTraceEvalAgentGateway: createAiGatewayMock,
    getTraceEvalAgentConfig: getAiGatewayConfigMock,
    getTraceEvalAgentSetupState: getAiGatewaySetupStateMock,
  };
});

import { buildTraceEvalSnapshot } from "../model/trace-eval-snapshot";
import {
  evaluateTraceEvalRun,
  handleTraceEvalAgentEvaluationRequest,
  handleTraceEvalAgentEvaluationStreamRequest,
} from "./evaluation";

const messages = [
  {
    id: "u1",
    parts: [
      {
        text: "Research the latest AI Gateway web search behavior.",
        type: "text" as const,
      },
    ],
    role: "user" as const,
  },
  {
    id: "a1",
    metadata: {
      finishedAt: 1600,
      model: "openai/gpt-5-mini",
      runId: "run_eval_test",
      searchTool: "web_search",
      startedAt: 1000,
      totalUsage: {
        inputTokens: 800,
        outputTokens: 240,
        totalTokens: 1040,
      },
    },
    parts: [
      {
        text: "It is probably useful for current research.",
        type: "text" as const,
      },
    ],
    role: "assistant" as const,
  },
];
const snapshot = buildTraceEvalSnapshot(messages, false);

describe("evaluateTraceEvalRun", () => {
  beforeEach(() => {
    createAiGatewayMock.mockReset();
    generateTextMock.mockReset();
    getAiGatewayConfigMock.mockReset();
    getAiGatewaySetupStateMock.mockReset();
    outputObjectMock.mockReset();
    streamTextMock.mockReset();

    createAiGatewayMock.mockReturnValue(
      vi.fn((modelId: string) => `gateway-model:${modelId}`)
    );
    getAiGatewayConfigMock.mockReturnValue({
      apiKey: "test-key",
      baseURL: "https://ai-gateway.example/v3/ai",
      chatModel: "openai/gpt-5-mini",
    });
    getAiGatewaySetupStateMock.mockReturnValue({
      config: {
        baseURL: "https://ai-gateway.example/v3/ai",
        chatModel: "openai/gpt-5-mini",
      },
      isReady: true,
      issues: [],
      nodeVersion: "v25.0.0",
    });
    outputObjectMock.mockReturnValue("judge-output-schema");
    generateTextMock.mockResolvedValue({
      output: {
        action: "ready",
        dimensions: [
          {
            id: "answer-usefulness",
            rationale: "The answer is too thin for the prompt.",
            score: 0.35,
            title: "Answer usefulness",
          },
        ],
        overallScore: 0.32,
        rationale:
          "The run skipped required search and did not provide source evidence.",
        summary: "The answer should be rerun with web search.",
      },
    });
    streamTextMock.mockReturnValue({
      textStream: (function* () {
        yield '{"summary":"Structured';
        yield ' judge output","overallScore":0.92,"rationale":"Useful and grounded.","dimensions":[{"id":"answer-usefulness","title":"Answer usefulness","score":0.95,"rationale":"Useful."}],"action":"ready"}';
      })(),
    });
  });

  it("runs the LLM judge with answer, trace, usage, and deterministic failures", async () => {
    const result = await evaluateTraceEvalRun(snapshot, {
      AI_GATEWAY_API_KEY: "test-key",
      AI_GATEWAY_CHAT_MODEL: "openai/gpt-5-mini",
    });

    expect(createAiGatewayMock).toHaveBeenCalled();
    expect(outputObjectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "TraceEvalJudgeResult",
      })
    );
    expect(generateTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        experimental_telemetry: expect.objectContaining({
          functionId: "trace-eval-agent.judge",
          isEnabled: true,
        }),
        model: "gateway-model:openai/gpt-5-mini",
        output: "judge-output-schema",
        prompt: expect.stringContaining("Deterministic failures:"),
        system: expect.stringContaining("LLM-as-judge evaluator"),
      })
    );
    expect(generateTextMock.mock.calls[0]?.[0].prompt).toContain(
      "gateway-search"
    );
    expect(result.judge).toMatchObject({
      action: "rerun-research",
      deterministicFailures: [
        expect.objectContaining({ id: "gateway-search" }),
        expect.objectContaining({ id: "source-coverage" }),
        expect.objectContaining({ id: "answer-shape" }),
      ],
      model: "openai/gpt-5-mini",
      overallScore: 0.32,
    });
  });

  it("handles evaluation requests through a JSON API response", async () => {
    const response = await handleTraceEvalAgentEvaluationRequest(
      new Request("https://example.test/api/demos/trace-eval-agent/evaluate", {
        body: JSON.stringify({ snapshot }),
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5-mini",
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.judge).toMatchObject({
      action: "rerun-research",
      model: "openai/gpt-5-mini",
    });
  });

  it("streams structured judge JSON text for useObject consumers", async () => {
    const response = await handleTraceEvalAgentEvaluationStreamRequest(
      new Request(
        "https://example.test/api/demos/trace-eval-agent/evaluate/stream",
        {
          body: JSON.stringify({ snapshot }),
          method: "POST",
        }
      ),
      {
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5-mini",
      }
    );

    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(streamTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gateway-model:openai/gpt-5-mini",
        output: "judge-output-schema",
        prompt: expect.stringContaining("Deterministic failures:"),
        system: expect.stringContaining("LLM-as-judge evaluator"),
      })
    );
    expect(body).toContain('"summary":"Structured judge output"');
    expect(body).toContain('"overallScore":0.92');
    expect(body).toContain('"action":"ready"');
  });

  it("returns a client error when the object stream request has no snapshot", async () => {
    const response = await handleTraceEvalAgentEvaluationStreamRequest(
      new Request(
        "https://example.test/api/demos/trace-eval-agent/evaluate/stream",
        {
          body: JSON.stringify({}),
          method: "POST",
        }
      ),
      {
        AI_GATEWAY_API_KEY: "test-key",
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Expected a JSON body with a "snapshot" object.',
    });
  });

  it("returns a client error when the object stream request is missing a completed run", async () => {
    const response = await handleTraceEvalAgentEvaluationStreamRequest(
      new Request(
        "https://example.test/api/demos/trace-eval-agent/evaluate/stream",
        {
          body: JSON.stringify({
            snapshot: {
              ...snapshot,
              latestAnswer: "",
            },
          }),
          method: "POST",
        }
      ),
      {
        AI_GATEWAY_API_KEY: "test-key",
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error:
        "Trace eval judge requires a completed conversation with a user prompt and assistant answer.",
    });
  });

  it("keeps structurally valid low-quality runs on the revision path", async () => {
    const userMessage = messages[0];
    const assistantMessage = messages[1];

    if (!(userMessage && assistantMessage)) {
      throw new Error("Expected evaluation test messages to be initialized.");
    }

    generateTextMock.mockResolvedValue({
      output: {
        action: "ready",
        dimensions: [
          {
            id: "answer-usefulness",
            rationale: "Useful but not crisp enough.",
            score: 0.7,
            title: "Answer usefulness",
          },
        ],
        overallScore: 0.7,
        rationale: "The run is valid but should be edited.",
        summary: "The answer needs revision.",
      },
    });

    const validRunMessages = [
      userMessage,
      {
        ...assistantMessage,
        parts: [
          {
            input: {
              query: "AI Gateway web search behavior",
            },
            output: {},
            state: "output-available" as const,
            toolCallId: "call_search",
            type: "tool-web_search" as const,
          },
          {
            providerMetadata: undefined,
            sourceId: "src_1",
            title: "Source one",
            type: "source-url" as const,
            url: "https://example.com/one",
          },
          {
            providerMetadata: undefined,
            sourceId: "src_2",
            title: "Source two",
            type: "source-url" as const,
            url: "https://example.com/two",
          },
          {
            text: "AI Gateway web search is useful for current research because it provides source-backed context before the final answer. Compared with building a custom search stack, the production recommendation is to use the built-in search path first, then add custom retrieval only when domain-specific indexing or policy control is required.",
            type: "text" as const,
          },
        ],
      },
    ];

    const result = await evaluateTraceEvalRun(
      buildTraceEvalSnapshot(validRunMessages, false),
      {
        AI_GATEWAY_API_KEY: "test-key",
        AI_GATEWAY_CHAT_MODEL: "openai/gpt-5-mini",
      }
    );

    expect(result.judge).toMatchObject({
      action: "needs-revision",
      deterministicFailures: [],
      overallScore: 0.7,
    });
  });

  it("rejects malformed evaluation request bodies", async () => {
    const response = await handleTraceEvalAgentEvaluationRequest(
      new Request("https://example.test/api/demos/trace-eval-agent/evaluate", {
        body: JSON.stringify({}),
        method: "POST",
      }),
      {
        AI_GATEWAY_API_KEY: "test-key",
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Expected a JSON body with a "snapshot" object.',
    });
  });
});
