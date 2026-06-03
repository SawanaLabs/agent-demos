import type { UIMessage } from "ai";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { configuredMcpServers, configuredMcpTools } from "../server/runtime";
import { McpAgentWorkspace } from "./mcp-agent-workspace";

interface McpAgentChatState {
  clearError: () => void;
  error: Error | null;
  hasMessages: boolean;
  isBusy: boolean;
  messages: UIMessage[];
  regenerate: () => void;
  sendMessage: (message: { text: string }) => void;
  status: "ready";
  stop: () => void;
}

const chatState = vi.hoisted(() => ({
  current: {
    clearError: () => undefined,
    error: null,
    hasMessages: false,
    isBusy: false,
    messages: [],
    regenerate: () => undefined,
    sendMessage: () => undefined,
    status: "ready",
    stop: () => undefined,
  } as McpAgentChatState,
}));

vi.mock("./use-mcp-agent-chat", () => ({
  useMcpAgentChat: () => chatState.current,
}));

function createWorkspaceMarkup() {
  return renderToStaticMarkup(
    createElement(McpAgentWorkspace, {
      chatModel: "openai/gpt-5-mini",
      configuredServers: configuredMcpServers,
      configuredTools: configuredMcpTools,
      isChatAvailable: false,
      nodeVersion: "Node v24.14.0",
      setupMessage:
        "AI_GATEWAY_API_KEY is missing. The demo can render, but MCP agent chat requests will fail until it is configured.",
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

describe("mcp-agent workspace UI", () => {
  beforeEach(() => {
    chatState.current = {
      clearError: () => undefined,
      error: null,
      hasMessages: false,
      isBusy: false,
      messages: [],
      regenerate: () => undefined,
      sendMessage: () => undefined,
      status: "ready",
      stop: () => undefined,
    };
  });

  it("disables sample prompts when MCP agent setup is unavailable", () => {
    const markup = createWorkspaceMarkup();

    expectButtonDisabled(
      markup,
      "Review the project docs and tell me what MCP agent demo should cover."
    );
  });

  it("disables retry when MCP agent setup is unavailable", () => {
    chatState.current = {
      ...chatState.current,
      hasMessages: true,
      messages: [
        {
          id: "message-1",
          metadata: undefined,
          parts: [{ text: "Review the project docs.", type: "text" }],
          role: "user",
        },
      ],
    };

    const markup = createWorkspaceMarkup();

    expectButtonDisabled(markup, "Retry");
  });
});
