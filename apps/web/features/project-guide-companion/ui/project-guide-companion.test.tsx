import {
  Conversation,
  ConversationContent,
} from "@workspace/ui/components/ai-elements/conversation";
import type { UIMessage } from "ai";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  findProjectGuideCompanionModel,
  getProjectGuideCompanionDefaultModel,
} from "../model-catalog";
import {
  ProjectGuideCompanionPanel,
  ProjectGuideCompanionScrollButton,
} from "./project-guide-companion-panel";

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

vi.mock("@workspace/ui/components/ai-elements/model-selector", () => ({
  ModelSelector: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  ModelSelectorContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  ModelSelectorEmpty: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  ModelSelectorGroup: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  ModelSelectorInput: ({ placeholder }: { placeholder?: string }) => (
    <input placeholder={placeholder} />
  ),
  ModelSelectorItem: ({
    children,
    onSelect,
    value,
  }: {
    children: ReactNode;
    onSelect?: () => void;
    value?: string;
  }) => (
    <button data-value={value} onClick={onSelect} type="button">
      {children}
    </button>
  ),
  ModelSelectorList: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  ModelSelectorLogo: ({ provider }: { provider: string }) => (
    <span data-provider={provider} />
  ),
  ModelSelectorName: ({ children }: { children: ReactNode }) => (
    <span>{children}</span>
  ),
  ModelSelectorTrigger: ({ children }: { children: ReactNode }) => (
    <button type="button">{children}</button>
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
  function loadPanelModelProps() {
    const selectedChatModel = getProjectGuideCompanionDefaultModel();

    return {
      isModelSelectorOpen: false,
      onModelChange: () => undefined,
      onModelSelectorOpenChange: () => undefined,
      selectedChatModel,
      selectedModel: findProjectGuideCompanionModel(selectedChatModel),
    };
  }

  it("keeps mobile conversation scrolling inside the drawer", () => {
    const modelProps = loadPanelModelProps();
    const markup = renderToStaticMarkup(
      <ProjectGuideCompanionPanel
        canSend={false}
        error={undefined}
        input=""
        isBusy={false}
        launcherLabel="Project compass"
        messages={messages}
        onClearHistory={() => undefined}
        onClose={() => undefined}
        onInputChange={() => undefined}
        onSendMessage={() => undefined}
        onStop={() => undefined}
        {...modelProps}
        status="ready"
      />
    );

    expect(markup).toContain("h-[min(82svh,620px)]");
    expect(markup).toContain("overflow-hidden");
    expect(markup).toContain("overflow-y-auto");
    expect(markup).toContain("overscroll-contain");
    expect(markup).toContain("touch-pan-y");
  });

  it("shows the selected model in the composer footer", () => {
    const modelProps = loadPanelModelProps();
    const markup = renderToStaticMarkup(
      <ProjectGuideCompanionPanel
        canSend={false}
        error={undefined}
        input=""
        isBusy={false}
        launcherLabel="Project compass"
        messages={messages}
        onClearHistory={() => undefined}
        onClose={() => undefined}
        onInputChange={() => undefined}
        onSendMessage={() => undefined}
        onStop={() => undefined}
        {...modelProps}
        status="ready"
      />
    );

    expect(markup).toContain("GLM-5");
    expect(markup).not.toContain(">Project docs</span>");
  });

  it("exposes the companion scroll-to-bottom affordance when the conversation is away from bottom", () => {
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
