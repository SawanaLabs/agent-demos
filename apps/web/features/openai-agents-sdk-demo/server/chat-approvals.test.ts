import type { UIMessage } from "ai";
import { beforeEach, expect, it, vi } from "vitest";

import {
  drainReadableStream,
  executeLatestUiMessageStream,
  importChatModule,
  MemorySessionMock,
  RunStateMock,
  resetOpenAiAgentsSdkDemoChatMocks,
  runMock,
} from "./chat-test-fixtures";

beforeEach(resetOpenAiAgentsSdkDemoChatMocks);

it("serializes paused RunState metadata when a tool approval interruption is returned", async () => {
  const { streamOpenAiAgentsSdkDemo } = await importChatModule();

  runMock.mockResolvedValueOnce({
    completed: Promise.resolve(),
    interruptions: [createApprovalInterruption()],
    lastResponseId: "resp_hitl_123",
    newItems: [],
    state: {
      toString: () => "serialized-run-state",
      usage: {
        requests: 1,
      },
    },
  });

  await streamOpenAiAgentsSdkDemo(
    [
      {
        id: "u1",
        parts: [
          {
            text: "Share the Tesla conclusion with the investment committee.",
            type: "text",
          },
        ],
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
      approvalSummary: {
        decisions: [],
        hasPendingApprovals: true,
        pendingApprovals: [
          {
            agentName: "OpenAI Agents SDK Demo",
            approvalId: "approval_1",
            argumentsPreview:
              '{"audience":"investment committee","company":"Tesla","summary":"Gross margin pressure still needs sign-off."}',
            toolCallId: "call_approval_1",
            toolName: "publish_research_summary",
          },
        ],
        serializedRunState: "serialized-run-state",
      },
      lastResponseId: "resp_hitl_123",
      resultSummary: expect.objectContaining({
        hasResumableState: true,
        interruptionCount: 1,
      }),
      usedGuideIds: expect.arrayContaining([
        "running-agents",
        "human-in-the-loop",
        "results",
        "sessions",
      ]),
      usedToolNames: ["publish_research_summary"],
    }),
    type: "message-metadata",
  });
});

it("resumes a paused run from serialized RunState after an approval response", async () => {
  const { streamOpenAiAgentsSdkDemo } = await importChatModule();
  const interruption = createApprovalInterruption();
  const approve = vi.fn();
  const reject = vi.fn();
  const getInterruptions = vi.fn(() => [interruption]);
  const resumedState = {
    approve,
    getInterruptions,
    reject,
    toString: vi.fn(() => "serialized-run-state"),
  };

  RunStateMock.fromString.mockReturnValueOnce(resumedState);
  runMock.mockResolvedValueOnce({
    completed: Promise.resolve(),
    lastResponseId: "resp_resume_123",
    newItems: [
      {
        output: "shared",
        rawItem: {
          callId: "call_approval_1",
          name: "publish_research_summary",
          output: "shared",
          type: "function_call",
        },
      },
    ],
    output: ["shared"],
    state: {
      toString: () => "resumed-run-state",
      usage: {
        requests: 2,
      },
    },
  });

  await streamOpenAiAgentsSdkDemo(createApprovalResponseMessages(), {
    AI_GATEWAY_API_KEY: "gateway-key",
  });

  expect(RunStateMock.fromString).toHaveBeenCalledWith(
    expect.anything(),
    "serialized-run-state"
  );
  expect(approve).toHaveBeenCalledWith(interruption);
  expect(reject).not.toHaveBeenCalled();
  expect(runMock).toHaveBeenLastCalledWith(
    expect.anything(),
    resumedState,
    expect.objectContaining({
      maxTurns: 8,
      session: expect.any(MemorySessionMock),
      sandbox: expect.objectContaining({
        client: expect.anything(),
      }),
      stream: true,
    })
  );

  const { merge, mergedStream, write } = await executeLatestUiMessageStream();

  expect(merge).toHaveBeenCalledWith(expect.any(ReadableStream));
  expect(mergedStream).toBeInstanceOf(ReadableStream);
  await drainReadableStream(mergedStream as ReadableStream<unknown>);
  expect(write).toHaveBeenCalledWith({
    messageMetadata: expect.objectContaining({
      approvalSummary: {
        decisions: [
          {
            approvalId: "approval_1",
            approved: true,
            reason: "Reviewer approved the request.",
          },
        ],
        hasPendingApprovals: false,
        pendingApprovals: [],
      },
      lastResponseId: "resp_resume_123",
      usedGuideIds: expect.arrayContaining([
        "running-agents",
        "human-in-the-loop",
        "results",
        "sessions",
        "tools",
      ]),
      usedToolNames: ["publish_research_summary"],
    }),
    type: "message-metadata",
  });
});

it("blocks a normal user turn while a tool approval is still pending", async () => {
  const { streamOpenAiAgentsSdkDemo } = await importChatModule();

  await expect(
    streamOpenAiAgentsSdkDemo(createPendingApprovalMessages(), {
      AI_GATEWAY_API_KEY: "gateway-key",
    })
  ).rejects.toThrow("A tool approval is pending");
  expect(runMock).not.toHaveBeenCalled();
});

function createApprovalInterruption() {
  return {
    agent: {
      name: "OpenAI Agents SDK Demo",
    },
    arguments: {
      audience: "investment committee",
      company: "Tesla",
      summary: "Gross margin pressure still needs sign-off.",
    },
    rawItem: {
      callId: "call_approval_1",
      id: "approval_1",
    },
    toolName: "publish_research_summary",
  };
}

function createApprovalResponseMessages(): UIMessage[] {
  return [
    {
      id: "u1",
      parts: [
        {
          text: "Share the Tesla conclusion with the investment committee.",
          type: "text",
        },
      ],
      role: "user",
    },
    {
      id: "a1",
      metadata: {
        approvalSummary: {
          decisions: [],
          hasPendingApprovals: true,
          pendingApprovals: [
            {
              approvalId: "approval_1",
              toolCallId: "call_approval_1",
              toolName: "publish_research_summary",
            },
          ],
          serializedRunState: "serialized-run-state",
        },
      },
      parts: [
        {
          approval: {
            approved: true,
            id: "approval_1",
            reason: "Reviewer approved the request.",
          },
          input: {
            audience: "investment committee",
            company: "Tesla",
            summary: "Gross margin pressure still needs sign-off.",
          },
          state: "approval-responded",
          toolCallId: "call_approval_1",
          toolName: "publish_research_summary",
          type: "dynamic-tool",
        },
      ],
      role: "assistant",
    },
  ];
}

function createPendingApprovalMessages(): UIMessage[] {
  return [
    {
      id: "a1",
      metadata: {
        approvalSummary: {
          decisions: [],
          hasPendingApprovals: true,
          pendingApprovals: [
            {
              approvalId: "approval_1",
              toolCallId: "call_approval_1",
              toolName: "publish_research_summary",
            },
          ],
          serializedRunState: "serialized-run-state",
        },
      },
      parts: [
        {
          approval: {
            id: "approval_1",
          },
          input: {
            audience: "investment committee",
            company: "Tesla",
            summary: "Gross margin pressure still needs sign-off.",
          },
          state: "approval-requested",
          toolCallId: "call_approval_1",
          toolName: "publish_research_summary",
          type: "dynamic-tool",
        },
      ],
      role: "assistant",
    },
    {
      id: "u1",
      parts: [{ text: "continue", type: "text" }],
      role: "user",
    },
  ];
}
