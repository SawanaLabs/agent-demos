import {
  WebPreview,
  WebPreviewConsole,
} from "@workspace/ui/components/ai-elements/web-preview";
import { Tabs } from "@workspace/ui/components/tabs";
import type { UIMessage } from "ai";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  appendPreviewHistory,
  formatPreviewStatusSummary,
  getLatestPreviewOutput,
  movePreviewHistory,
  parsePreviewStatus,
  sanitizePreviewText,
} from "./preview-state";
import { SandboxConversationPane } from "./sandbox-conversation-pane";

function createAssistantMessage(parts: UIMessage["parts"]): UIMessage {
  return {
    id: "assistant-1",
    metadata: undefined,
    parts,
    role: "assistant",
  };
}

describe("sandbox-agent workspace UI", () => {
  it("surfaces the latest preview across assistant messages", () => {
    const messages: UIMessage[] = [
      createAssistantMessage([
        {
          input: { directory: "prototype-v1" },
          output: {
            directory: "prototype-v1",
            entryPath: "index.html",
            port: 3000,
            url: "https://sandbox-preview-1.example",
          },
          state: "output-available",
          toolCallId: "tool-1",
          toolName: "startPreview",
          type: "dynamic-tool",
        },
      ]),
      createAssistantMessage([
        {
          input: { directory: "prototype-v2" },
          output: {
            directory: "prototype-v2",
            entryPath: "index.html",
            port: 3001,
            url: "https://sandbox-preview-2.example",
          },
          state: "output-available",
          toolCallId: "tool-2",
          toolName: "startPreview",
          type: "dynamic-tool",
        },
      ]),
    ];

    expect(getLatestPreviewOutput(messages)).toEqual({
      directory: "prototype-v2",
      entryPath: "index.html",
      port: 3001,
      url: "https://sandbox-preview-2.example",
    });
  });

  it("replaces the raw preview URL in assistant text", () => {
    expect(
      sanitizePreviewText(
        "Preview available at https://sandbox-preview-2.example",
        "https://sandbox-preview-2.example"
      )
    ).toBe("Preview available at the Preview tab");
  });

  it("appends preview history without duplicating the current entry", () => {
    expect(
      appendPreviewHistory(["https://one.example"], 0, "https://one.example")
    ).toEqual({
      history: ["https://one.example"],
      index: 0,
    });

    expect(
      appendPreviewHistory(["https://one.example"], 0, "https://two.example")
    ).toEqual({
      history: ["https://one.example", "https://two.example"],
      index: 1,
    });
  });

  it("moves backward and forward through preview history safely", () => {
    expect(
      movePreviewHistory(
        ["https://one.example", "https://two.example", "https://three.example"],
        1,
        -1
      )
    ).toEqual({
      index: 0,
      url: "https://one.example",
    });

    expect(
      movePreviewHistory(
        ["https://one.example", "https://two.example", "https://three.example"],
        1,
        1
      )
    ).toEqual({
      index: 2,
      url: "https://three.example",
    });

    expect(movePreviewHistory(["https://one.example"], 0, -1)).toBeNull();
    expect(movePreviewHistory(["https://one.example"], 0, 1)).toBeNull();
  });

  it("parses preview status payloads from the preview-status route", () => {
    expect(
      parsePreviewStatus({
        errorCode: "SANDBOX_STOPPED",
        message: "This sandbox was stopped and is no longer reachable.",
        ok: false,
        status: 410,
        statusText: "Gone",
      })
    ).toEqual({
      errorCode: "SANDBOX_STOPPED",
      message: "This sandbox was stopped and is no longer reachable.",
      ok: false,
      status: 410,
      statusText: "Gone",
    });
  });

  it("formats a readable preview failure summary", () => {
    expect(
      formatPreviewStatusSummary({
        errorCode: "SANDBOX_STOPPED",
        message: "This sandbox was stopped and is no longer reachable.",
        ok: false,
        status: 410,
        statusText: "Gone",
      })
    ).toBe(
      "Preview is unavailable. HTTP 410 SANDBOX_STOPPED This sandbox was stopped and is no longer reachable."
    );
  });

  it("keeps the console chevron unrotated while the console is collapsed", () => {
    const markup = renderToStaticMarkup(
      createElement(
        WebPreview,
        null,
        createElement(WebPreviewConsole, { logs: [] })
      )
    );

    expect(markup).not.toContain("rotate-180");
  });

  it("disables sample prompts when sandbox chat setup is unavailable", () => {
    const samplePrompt =
      "Build a pricing landing page with an interactive calculator and start a live preview.";
    const markup = renderToStaticMarkup(
      createElement(
        Tabs,
        { value: "conversation" },
        createElement(SandboxConversationPane, {
          chatModel: "openai/gpt-5-mini",
          hasMessages: false,
          isBusy: false,
          isChatAvailable: false,
          messages: [],
          onOpenPreview: () => undefined,
          onRegenerate: () => undefined,
          onSendMessage: () => undefined,
          onStop: () => undefined,
          samplePrompts: [samplePrompt],
          status: "ready",
        })
      )
    );
    const promptIndex = markup.indexOf(samplePrompt);
    const buttonStart = markup.lastIndexOf("<button", promptIndex);
    const buttonEnd = markup.indexOf(">", buttonStart);
    const sampleButtonOpeningTag = markup.slice(buttonStart, buttonEnd + 1);

    expect(promptIndex).toBeGreaterThan(-1);
    expect(sampleButtonOpeningTag).toMatch(
      /\sdisabled(?:=""|="true"|(?=\s|>))/
    );
  });
});
