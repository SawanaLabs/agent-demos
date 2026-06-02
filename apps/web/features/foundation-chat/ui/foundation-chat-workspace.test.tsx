import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { FoundationChatWorkspace } from "./foundation-chat-workspace";

vi.mock("./use-foundation-chat", () => ({
  useFoundationChat: () => ({
    error: null,
    hasMessages: false,
    isBusy: false,
    messages: [],
    regenerate: vi.fn(),
    sendMessage: vi.fn(),
    status: "ready",
    stop: vi.fn(),
  }),
}));

function getButtonOpeningTagForText(markup: string, text: string) {
  const textIndex = markup.indexOf(text);
  expect(textIndex).toBeGreaterThanOrEqual(0);

  const buttonStart = markup.lastIndexOf("<button", textIndex);
  const buttonTagEnd = markup.indexOf(">", buttonStart);

  expect(buttonStart).toBeGreaterThanOrEqual(0);
  expect(buttonTagEnd).toBeGreaterThanOrEqual(0);

  return markup.slice(buttonStart, buttonTagEnd);
}

describe("foundation chat workspace UI", () => {
  it("disables sample prompts when chat setup is unavailable", () => {
    const samplePrompt =
      "Explain the minimum files this Foundation Chat demo needs in a fresh Next.js app.";
    const markup = renderToStaticMarkup(
      createElement(FoundationChatWorkspace, {
        chatModel: "openai/gpt-4.1-mini",
        isChatAvailable: false,
        nodeVersion: "Node v24.14.0",
        setupMessage:
          "AI_GATEWAY_API_KEY is missing. The demo can render, but chat requests will fail until it is configured.",
      })
    );

    expect(getButtonOpeningTagForText(markup, samplePrompt)).toMatch(
      /\sdisabled(?:=|\s|$)/
    );
  });
});
