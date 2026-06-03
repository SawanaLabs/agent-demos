import type { UIMessage } from "ai";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SkillsAgentWorkspace } from "./skills-agent-workspace";

interface SkillsAgentChatState {
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
  } as SkillsAgentChatState,
}));

vi.mock("./use-skills-agent-chat", () => ({
  useSkillsAgentChat: () => chatState.current,
}));

function createWorkspaceMarkup() {
  return renderToStaticMarkup(
    createElement(SkillsAgentWorkspace, {
      availableSkills: [
        {
          description: "Challenge an idea until project context is durable.",
          name: "grill-with-docs",
        },
      ],
      chatModel: "openai/gpt-5-mini",
      environmentLabel: "Node 24 + uv Python 3.13",
      isChatAvailable: false,
      sandboxProvider: "Vercel Sandbox",
      setupMessage:
        "AI_GATEWAY_API_KEY is missing. The demo can render, but skills-agent chat requests will fail until it is configured.",
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

describe("skills agent workspace UI", () => {
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

  it("disables sample prompts when skills-agent setup is unavailable", () => {
    const markup = createWorkspaceMarkup();

    expectButtonDisabled(markup, "Grill this rough idea for a docs chatbot.");
  });

  it("disables retry when skills-agent setup is unavailable", () => {
    chatState.current = {
      ...chatState.current,
      hasMessages: true,
      messages: [
        {
          id: "message-1",
          metadata: undefined,
          parts: [{ text: "Grill this rough idea.", type: "text" }],
          role: "user",
        },
      ],
    };

    const markup = createWorkspaceMarkup();

    expectButtonDisabled(markup, "Retry");
  });
});
