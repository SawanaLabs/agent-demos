import type { ComponentProps, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { UltraChatbotAgentChatRecord } from "../server/chat-store";
import { UltraChatbotAgentHistoryItem } from "./ultra-chatbot-agent-history-item";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: ComponentProps<"a"> & {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

function getOpeningTagBeforeText(
  markup: string,
  tagName: string,
  text: string
) {
  const textIndex = markup.indexOf(text);
  expect(textIndex).toBeGreaterThanOrEqual(0);

  const tagStart = markup.lastIndexOf(`<${tagName}`, textIndex);
  const tagEnd = markup.indexOf(">", tagStart);

  expect(tagStart).toBeGreaterThanOrEqual(0);
  expect(tagEnd).toBeGreaterThanOrEqual(0);

  return markup.slice(tagStart, tagEnd);
}

function createChatRecord(
  input: Partial<UltraChatbotAgentChatRecord> = {}
): UltraChatbotAgentChatRecord {
  return {
    activeStreamId: null,
    capabilities: {
      sandboxEnabled: false,
    },
    createdAt: "2026-06-07T03:00:00.000Z",
    id: "chat-1",
    selectedChatModel: "openai/gpt-4.1-mini",
    title: "Test chat",
    updatedAt: "2026-06-07T03:35:00.000Z",
    visibility: "private",
    visitorId: "visitor-1",
    ...input,
  };
}

describe("UltraChatbotAgentHistoryItem", () => {
  it("lets long chat titles shrink and wrap inside the mobile history column", () => {
    const title = "Draft a launch brief for a developer-facing AI feature.";
    const markup = renderToStaticMarkup(
      <UltraChatbotAgentHistoryItem
        chat={createChatRecord({
          title,
        })}
        isActive={true}
      />
    );
    const itemTag = markup.slice(0, markup.indexOf(">"));
    const titleRowTag = getOpeningTagBeforeText(markup, "div", title);
    const titleTag = getOpeningTagBeforeText(markup, "span", title);

    expect(itemTag).toContain("min-w-0");
    expect(titleRowTag).toContain("min-w-0");
    expect(titleTag).toContain("min-w-0");
    expect(titleTag).toContain("break-words");
    expect(titleTag).toContain("[overflow-wrap:anywhere]");
  });
});
