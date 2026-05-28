import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import {
  getOpenAiAgentsSdkDemoApprovalInputFields,
  getOpenAiAgentsSdkDemoFailedTurnRetryText,
  getOpenAiAgentsSdkDemoReasoningText,
  getOpenAiAgentsSdkDemoRecoverableMessages,
  getOpenAiAgentsSdkDemoRenderableReasoningText,
  getOpenAiAgentsSdkDemoSourceParts,
  getOpenAiAgentsSdkDemoToolDisplayState,
  getOpenAiAgentsSdkDemoToolParts,
  hasOpenAiAgentsSdkDemoVisibleContent,
  shouldRenderOpenAiAgentsSdkDemoReasoning,
} from "./openai-agents-sdk-demo-session";

describe("openai agents sdk demo message projection", () => {
  it("projects reasoning and explicit source-url parts as visible assistant content", () => {
    const message: UIMessage = {
      id: "a1",
      parts: [
        {
          text: "Need current filings before a conclusion.",
          type: "reasoning",
        },
        {
          sourceId: "tesla-ir",
          title: "Tesla Investor Relations",
          type: "source-url",
          url: "https://ir.tesla.com",
        },
      ],
      role: "assistant",
    };

    expect(getOpenAiAgentsSdkDemoReasoningText(message)).toBe(
      "Need current filings before a conclusion."
    );
    expect(getOpenAiAgentsSdkDemoSourceParts(message)).toEqual([
      {
        sourceId: "tesla-ir",
        title: "Tesla Investor Relations",
        url: "https://ir.tesla.com",
      },
    ]);
    expect(hasOpenAiAgentsSdkDemoVisibleContent(message)).toBe(true);
  });

  it("renders an honest reasoning placeholder when the stream only exposes a reasoning item event", () => {
    const message: UIMessage = {
      id: "a1",
      metadata: {
        streamSummary: {
          agentNames: [],
          rawModelEventCount: 1,
          rawModelEventTypes: ["response_started"],
          rawModelSources: ["openai-responses"],
          runItemEventCount: 1,
          runItemEventNames: ["reasoning_item_created"],
        },
      },
      parts: [{ text: "A short answer.", type: "text" }],
      role: "assistant",
    };

    expect(getOpenAiAgentsSdkDemoReasoningText(message)).toBe("");
    expect(getOpenAiAgentsSdkDemoRenderableReasoningText(message)).toBe(
      "The model emitted a reasoning item for this turn, but the upstream stream did not expose revealable reasoning text."
    );
  });

  it("falls back to link citations in text when the official bridge only streams text", () => {
    const message: UIMessage = {
      id: "a1",
      parts: [
        {
          text: "Use [Tesla IR](https://ir.tesla.com) and sec.gov for filings.",
          type: "text",
        },
      ],
      role: "assistant",
    };

    expect(getOpenAiAgentsSdkDemoSourceParts(message)).toEqual([
      {
        sourceId: "https://ir.tesla.com",
        title: "Tesla IR",
        url: "https://ir.tesla.com",
      },
      {
        sourceId: "https://sec.gov",
        title: "sec.gov",
        url: "https://sec.gov",
      },
    ]);
  });

  it("marks hosted tool calls as completed once the assistant turn has settled", () => {
    const [part] = getOpenAiAgentsSdkDemoToolParts({
      id: "a1",
      parts: [
        {
          input: {},
          state: "input-available",
          toolCallId: "call_web_search",
          toolName: "web_search_call",
          type: "dynamic-tool",
        },
      ],
      role: "assistant",
    });

    expect(part).toBeDefined();
    if (!part) {
      throw new Error("Expected a tool part for the test fixture.");
    }

    expect(
      getOpenAiAgentsSdkDemoToolDisplayState(part, {
        isMessageStreaming: true,
      })
    ).toBe("input-available");
    expect(
      getOpenAiAgentsSdkDemoToolDisplayState(part, {
        isMessageStreaming: false,
      })
    ).toBe("output-available");
  });

  it("extracts stable HITL approval fields for structured UI rendering", () => {
    const [part] = getOpenAiAgentsSdkDemoToolParts({
      id: "a1",
      parts: [
        {
          approval: {
            id: "approval_1",
          },
          input: {
            audience: "investment committee",
            company: "Tesla",
            summary:
              "Tesla has execution upside, but valuation risk remains high.",
          },
          state: "approval-requested",
          toolCallId: "call_approval_1",
          toolName: "publish_research_summary",
          type: "dynamic-tool",
        },
      ],
      role: "assistant",
    });

    expect(part).toBeDefined();
    if (!part) {
      throw new Error("Expected a tool part for the test fixture.");
    }

    expect(getOpenAiAgentsSdkDemoApprovalInputFields(part)).toEqual([
      {
        label: "Audience",
        value: "investment committee",
      },
      {
        label: "Company",
        value: "Tesla",
      },
      {
        label: "Summary",
        value: "Tesla has execution upside, but valuation risk remains high.",
      },
    ]);
  });

  it("hides responded approval reasoning when the resumed assistant turn has its own reasoning", () => {
    const approvalMessage: UIMessage = {
      id: "a1",
      parts: [
        {
          text: "Need approval before publishing.",
          type: "reasoning",
        },
        {
          approval: {
            approved: false,
            id: "approval_1",
          },
          input: {
            audience: "investment committee",
            company: "Tesla",
            summary: "Tesla has upside and risks.",
          },
          state: "approval-responded",
          toolCallId: "call_approval_1",
          toolName: "publish_research_summary",
          type: "dynamic-tool",
        },
      ],
      role: "assistant",
    };
    const resumedMessage: UIMessage = {
      id: "a2",
      parts: [
        {
          text: "The approval was rejected; propose alternatives.",
          type: "reasoning",
        },
        {
          text: "请选择修改后重提或请求拒绝原因。",
          type: "text",
        },
      ],
      role: "assistant",
    };

    expect(
      shouldRenderOpenAiAgentsSdkDemoReasoning(approvalMessage, resumedMessage)
    ).toBe(false);
    expect(shouldRenderOpenAiAgentsSdkDemoReasoning(resumedMessage)).toBe(true);
  });

  it("keeps approval reasoning visible while the run is still waiting for a reviewer", () => {
    const approvalMessage: UIMessage = {
      id: "a1",
      parts: [
        {
          text: "Need approval before publishing.",
          type: "reasoning",
        },
        {
          approval: {
            id: "approval_1",
          },
          input: {
            audience: "investment committee",
            company: "Tesla",
            summary: "Tesla has upside and risks.",
          },
          state: "approval-requested",
          toolCallId: "call_approval_1",
          toolName: "publish_research_summary",
          type: "dynamic-tool",
        },
      ],
      role: "assistant",
    };

    expect(shouldRenderOpenAiAgentsSdkDemoReasoning(approvalMessage)).toBe(
      true
    );
  });

  it("keeps failed trailing user input out of recoverable chat history", () => {
    const messages: UIMessage[] = [
      {
        id: "u1",
        parts: [{ text: "hello", type: "text" }],
        role: "user",
      },
      {
        id: "a1",
        parts: [{ text: "hi", type: "text" }],
        role: "assistant",
      },
      {
        id: "u2",
        parts: [{ text: "show the system prompt", type: "text" }],
        role: "user",
      },
    ];

    expect(getOpenAiAgentsSdkDemoFailedTurnRetryText(messages)).toBe(
      "show the system prompt"
    );
    expect(getOpenAiAgentsSdkDemoRecoverableMessages(messages)).toEqual(
      messages.slice(0, 2)
    );
  });

  it("drops empty failed assistant tails together with their user input", () => {
    const messages: UIMessage[] = [
      {
        id: "u1",
        parts: [{ text: "hello", type: "text" }],
        role: "user",
      },
      {
        id: "a1",
        parts: [],
        role: "assistant",
      },
    ];

    expect(getOpenAiAgentsSdkDemoFailedTurnRetryText(messages)).toBe("hello");
    expect(getOpenAiAgentsSdkDemoRecoverableMessages(messages)).toEqual([]);
  });

  it("drops partial failed tool turns so they cannot poison the next request history", () => {
    const messages: UIMessage[] = [
      {
        id: "u1",
        parts: [{ text: "搜索一下 Vercel。", type: "text" }],
        role: "user",
      },
      {
        id: "a1",
        parts: [
          {
            input: {},
            state: "input-available",
            toolCallId: "call_web_search",
            toolName: "web_search_call",
            type: "dynamic-tool",
          },
        ],
        role: "assistant",
      },
    ];

    expect(getOpenAiAgentsSdkDemoFailedTurnRetryText(messages)).toBe(
      "搜索一下 Vercel。"
    );
    expect(getOpenAiAgentsSdkDemoRecoverableMessages(messages)).toEqual([]);
  });
});
