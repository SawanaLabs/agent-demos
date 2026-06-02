import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LangGraphAgentWorkspace } from "./langgraph-agent-workspace";
import type { LangGraphAgentMessage } from "./use-langgraph-agent";

type LangGraphAgentChatState = {
  error: Error | null;
  graphEvents: [];
  hasMessages: boolean;
  isBusy: boolean;
  messages: LangGraphAgentMessage[];
  regenerate: () => void;
  sendMessage: (message: { text: string }) => void;
  startNewThread: () => void;
  status: "ready";
  stop: () => void;
  threadId: string;
};

const chatState = vi.hoisted(() => ({
  current: {
    error: null,
    graphEvents: [],
    hasMessages: false,
    isBusy: false,
    messages: [],
    regenerate: () => undefined,
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
      error: null,
      graphEvents: [],
      hasMessages: false,
      isBusy: false,
      messages: [],
      regenerate: () => undefined,
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
});
