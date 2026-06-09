import type { UIMessage } from "ai";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    clearError: () => undefined,
    error: undefined,
    messages: [],
    sendMessage: () => undefined,
    setMessages: () => undefined,
    status: "ready",
    stop: () => undefined,
  }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    prefetch,
    ...props
  }: {
    children: ReactNode;
    href: string;
    prefetch?: boolean;
  }) => (
    <a data-prefetch={String(prefetch)} href={href} {...props}>
      {children}
    </a>
  ),
}));

const messages: UIMessage[] = [
  {
    id: "message-1",
    parts: [{ text: "Where should I start?", type: "text" }],
    role: "user",
  },
  {
    id: "message-2",
    parts: [{ text: "Start with the registry guide.", type: "text" }],
    role: "assistant",
  },
];

describe("ProjectGuideCompanionPanel", () => {
  it("keeps mobile conversation scrolling inside the drawer", async () => {
    const { ProjectGuideCompanionPanel } = await import(
      "./project-guide-companion"
    );
    const markup = renderToStaticMarkup(
      <ProjectGuideCompanionPanel
        canSend={false}
        error={undefined}
        input=""
        isBusy={false}
        messages={messages}
        onClearHistory={() => undefined}
        onClose={() => undefined}
        onInputChange={() => undefined}
        onSendMessage={() => undefined}
        onStop={() => undefined}
        status="ready"
        surface="home"
      />
    );

    expect(markup).toContain("h-[min(82svh,620px)]");
    expect(markup).toContain("overflow-hidden");
    expect(markup).toContain("overflow-y-auto");
    expect(markup).toContain("overscroll-contain");
    expect(markup).toContain("touch-pan-y");
  });

  it("exposes the companion scroll-to-bottom affordance when the conversation is away from bottom", async () => {
    const { Conversation, ConversationContent } = await import(
      "@workspace/ui/components/ai-elements/conversation"
    );
    const { ProjectGuideCompanionScrollButton } = await import(
      "./project-guide-companion"
    );
    const markup = renderToStaticMarkup(
      <Conversation initial={false}>
        <ConversationContent>Earlier messages</ConversationContent>
        <ProjectGuideCompanionScrollButton />
      </Conversation>
    );

    expect(markup).toContain(
      'aria-label="Scroll companion conversation to bottom"'
    );
    expect(markup).toContain('title="Scroll to bottom"');
    expect(markup).toContain("z-10");
  });
});
