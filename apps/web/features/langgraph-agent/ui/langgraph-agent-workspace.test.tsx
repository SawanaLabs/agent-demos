import type { ChatStatus } from "ai";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LangGraphAgentWorkspace } from "./langgraph-agent-workspace";
import type { LangGraphAgentMessage } from "./use-langgraph-agent";

interface LangGraphAgentChatState {
  clearError: () => void;
  error: Error | null;
  graphEvents: [];
  hasMessages: boolean;
  isBusy: boolean;
  messages: LangGraphAgentMessage[];
  regenerate: () => Promise<void>;
  sendMessage: (message: { text: string }) => void;
  startNewThread: () => void;
  status: ChatStatus;
  stop: () => void;
  threadId: string;
}

const chatState = vi.hoisted(() => ({
  current: {
    clearError: () => undefined,
    error: null,
    graphEvents: [],
    hasMessages: false,
    isBusy: false,
    messages: [],
    regenerate: async () => undefined,
    sendMessage: () => undefined,
    startNewThread: () => undefined,
    status: "ready",
    stop: () => undefined,
    threadId: "thread-1",
  } as LangGraphAgentChatState,
}));

vi.mock("./use-langgraph-agent", () => ({
  useLangGraphAgent: () => chatState.current,
}));

function createWorkspaceMarkup() {
  return renderToStaticMarkup(
    createElement(LangGraphAgentWorkspace, {
      assistantId: null,
      isChatAvailable: false,
      nodeVersion: "Node v24.14.0",
      remoteUrl: null,
      setupMessage:
        "LANGGRAPH_AGENT_API_URL is missing. Point it at a LangGraph Agent Server before using this demo.",
    })
  );
}

function getButtonOpeningTagForText(markup: string, text: string) {
  const textIndex = markup.indexOf(text);
  expect(textIndex).toBeGreaterThanOrEqual(0);

  const buttonStart = markup.lastIndexOf("<button", textIndex);
  const buttonTagEnd = markup.indexOf(">", buttonStart);

  expect(buttonStart).toBeGreaterThanOrEqual(0);
  expect(buttonTagEnd).toBeGreaterThanOrEqual(0);

  return markup.slice(buttonStart, buttonTagEnd + 1);
}

function expectButtonDisabled(markup: string, text: string) {
  expect(getButtonOpeningTagForText(markup, text)).toMatch(
    /\sdisabled(?:=""|="true"|(?=\s|>))/
  );
}

describe("langgraph-agent workspace UI", () => {
  beforeEach(() => {
    chatState.current = {
      clearError: () => undefined,
      error: null,
      graphEvents: [],
      hasMessages: false,
      isBusy: false,
      messages: [],
      regenerate: async () => undefined,
      sendMessage: () => undefined,
      startNewThread: () => undefined,
      status: "ready",
      stop: () => undefined,
      threadId: "thread-1",
    } as LangGraphAgentChatState;
  });

  it("disables sample prompts when LangGraph setup is unavailable", () => {
    const markup = createWorkspaceMarkup();

    expectButtonDisabled(
      markup,
      "Plan a safe LangGraph handoff from product research to implementation."
    );
  });

  it("shows setup-unavailable empty-state copy when LangGraph setup is unavailable", () => {
    const markup = createWorkspaceMarkup();

    expect(markup).toContain("LangGraph setup is required");
    expect(markup).not.toContain("LangGraph thread is ready");
  });

  it("disables retry when LangGraph setup is unavailable", () => {
    chatState.current = {
      ...chatState.current,
      hasMessages: true,
      messages: [
        {
          id: "message-1",
          metadata: undefined,
          parts: [{ text: "Plan the handoff.", type: "text" }],
          role: "user",
        } satisfies LangGraphAgentMessage,
      ],
    };

    const markup = createWorkspaceMarkup();

    expectButtonDisabled(markup, "Retry");
  });

  it("renders chat errors as assistant-side conversation error messages", () => {
    chatState.current = {
      ...chatState.current,
      error: new Error("LangGraph API returned an empty 500 response."),
      hasMessages: true,
      messages: [
        {
          id: "message-1",
          metadata: undefined,
          parts: [{ text: "Plan the handoff.", type: "text" }],
          role: "user",
        } satisfies LangGraphAgentMessage,
      ],
    };

    const markup = createWorkspaceMarkup();

    expect(markup).toContain("Assistant response failed");
    expect(markup).toContain("LangGraph API returned an empty 500 response.");
  });

  it.each([
    "submitted",
    "streaming",
  ] as const)("shows Thinking while %s before the first assistant message arrives", (status) => {
    chatState.current = {
      ...chatState.current,
      hasMessages: true,
      isBusy: true,
      messages: [
        {
          id: "message-1",
          parts: [{ text: "你好", type: "text" }],
          role: "user",
        },
      ],
      status,
    };

    const markup = createWorkspaceMarkup();

    expect(markup).toContain('aria-label="LangGraph is thinking"');
    expect(markup).toContain("Thinking through LangGraph...");
  });

  it("hands loading feedback over to the assistant trace without a duplicate indicator", () => {
    chatState.current = {
      ...chatState.current,
      hasMessages: true,
      isBusy: true,
      messages: [
        {
          id: "message-1",
          parts: [{ text: "你好", type: "text" }],
          role: "user",
        },
        { id: "message-2", parts: [], role: "assistant" },
      ],
      status: "streaming",
    };

    const markup = createWorkspaceMarkup();

    expect(markup.match(/Thinking through LangGraph\.\.\./g)).toHaveLength(1);
    expect(markup).not.toContain('aria-label="LangGraph is thinking"');
  });

  it.each([
    "ready",
    "error",
  ] as const)("removes pending Thinking when the request is %s without an assistant response", (status) => {
    chatState.current = {
      ...chatState.current,
      hasMessages: true,
      messages: [
        {
          id: "message-1",
          parts: [{ text: "你好", type: "text" }],
          role: "user",
        },
      ],
      status,
    };

    expect(createWorkspaceMarkup()).not.toContain(
      "Thinking through LangGraph..."
    );
  });
});
