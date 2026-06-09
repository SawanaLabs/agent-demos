"use client";

import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@workspace/ui/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@workspace/ui/components/ai-elements/prompt-input";
import {
  Suggestion,
  Suggestions,
} from "@workspace/ui/components/ai-elements/suggestion";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import type { ChatStatus, UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { Compass, Trash2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { prepareProjectGuideCompanionContextMessages } from "../message-history";
import { ProjectGuideCompanionMessageList } from "./project-guide-companion-messages";
import {
  getProjectGuideCompanionSurface,
  type ProjectGuideCompanionSurface,
  projectGuideCompanionRevealStorageKey,
  projectGuideCompanionStarterPrompts,
  projectGuideCompanionStorageKey,
  projectStorableCompanionMessages,
  projectVisibleCompanionMessages,
} from "./project-guide-companion-model";

function readStoredMessages() {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = window.sessionStorage.getItem(
    projectGuideCompanionStorageKey
  );

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    return Array.isArray(parsedValue)
      ? projectStorableCompanionMessages(parsedValue as UIMessage[])
      : [];
  } catch {
    return [];
  }
}

function persistMessages(messages: UIMessage[]) {
  if (typeof window === "undefined") {
    return;
  }

  const storableMessages = projectStorableCompanionMessages(messages);

  if (storableMessages.length === 0) {
    window.sessionStorage.removeItem(projectGuideCompanionStorageKey);
    return;
  }

  window.sessionStorage.setItem(
    projectGuideCompanionStorageKey,
    JSON.stringify(storableMessages)
  );
}

function createProjectGuideCompanionTransport() {
  return new DefaultChatTransport({
    api: "/api/project-guide-companion",
    credentials: "include",
    prepareSendMessagesRequest({ messages }) {
      return {
        body: {
          messages: prepareProjectGuideCompanionContextMessages({
            messages: projectVisibleCompanionMessages(messages),
          }),
        },
      };
    },
  });
}

function getLauncherLabel(surface: ProjectGuideCompanionSurface) {
  switch (surface) {
    case "demo":
      return "Project guide";
    case "guide":
      return "Guide companion";
    case "home":
      return "Project compass";
    default:
      return "Project compass";
  }
}

export function ProjectGuideCompanion() {
  const pathname = usePathname();
  const surface = getProjectGuideCompanionSurface(pathname);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [hasLoadedStorage, setHasLoadedStorage] = useState(false);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const transport = useMemo(createProjectGuideCompanionTransport, []);
  const {
    clearError,
    error,
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useChat({
    transport,
  });
  const isBusy = status === "submitted" || status === "streaming";
  const canSend = input.trim().length > 0 && !isBusy;

  useEffect(() => {
    setMessages(readStoredMessages());
    setHasLoadedStorage(true);
  }, [setMessages]);

  useEffect(() => {
    if (!hasLoadedStorage) {
      return;
    }

    persistMessages(messages);
  }, [hasLoadedStorage, messages]);

  useEffect(() => {
    if (surface !== "home" || typeof window === "undefined") {
      setShowReveal(false);
      return;
    }

    if (window.sessionStorage.getItem(projectGuideCompanionRevealStorageKey)) {
      return;
    }

    window.sessionStorage.setItem(projectGuideCompanionRevealStorageKey, "1");
    setShowReveal(true);

    const timeoutId = window.setTimeout(() => setShowReveal(false), 9000);

    return () => window.clearTimeout(timeoutId);
  }, [surface]);

  useEffect(() => {
    if (!showReveal) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }

      setShowReveal(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [showReveal]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement;

      if (
        rootRef.current?.contains(target) ||
        target.closest("[data-slot='dropdown-menu-content']")
      ) {
        return;
      }

      setShowReveal(false);
      setIsOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown);

    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  if (!(surface && hasLoadedStorage)) {
    return null;
  }

  async function sendCurrentMessage(text: string) {
    const trimmedText = text.trim();

    if (!trimmedText || isBusy) {
      return;
    }

    setInput("");
    setShowReveal(false);
    await sendMessage({ text: trimmedText });
  }

  function clearHistory() {
    clearError();
    setMessages([]);
    window.sessionStorage.removeItem(projectGuideCompanionStorageKey);
  }

  function openPanel() {
    setShowReveal(false);
    setIsOpen(true);
  }

  function closePanel() {
    setShowReveal(false);
    setIsOpen(false);
  }

  return (
    <div ref={rootRef}>
      {isOpen ? (
        <ProjectGuideCompanionPanel
          canSend={canSend}
          error={error}
          input={input}
          isBusy={isBusy}
          messages={messages}
          onClearHistory={clearHistory}
          onClose={closePanel}
          onInputChange={setInput}
          onSendMessage={sendCurrentMessage}
          onStop={stop}
          status={status}
          surface={surface}
        />
      ) : (
        <ProjectGuideCompanionLauncher
          onDismissReveal={() => setShowReveal(false)}
          onOpen={openPanel}
          showReveal={showReveal}
          surface={surface}
        />
      )}
    </div>
  );
}

interface ProjectGuideCompanionPanelProps {
  canSend: boolean;
  error: Error | undefined;
  input: string;
  isBusy: boolean;
  messages: UIMessage[];
  onClearHistory: () => void;
  onClose: () => void;
  onInputChange: (value: string) => void;
  onSendMessage: (text: string) => void;
  onStop: () => void;
  status: ChatStatus;
  surface: ProjectGuideCompanionSurface;
}

export function ProjectGuideCompanionPanel({
  canSend,
  error,
  input,
  isBusy,
  messages,
  onClearHistory,
  onClose,
  onInputChange,
  onSendMessage,
  onStop,
  status,
  surface,
}: ProjectGuideCompanionPanelProps) {
  return (
    <section
      aria-label="Project guide companion"
      className="fixed inset-x-0 bottom-0 z-50 flex h-[min(82svh,620px)] min-h-0 flex-col overflow-hidden border-border border-t bg-background shadow-2xl sm:inset-auto sm:right-4 sm:bottom-4 sm:h-[min(70vh,640px)] sm:w-[400px] sm:border"
    >
      <ProjectGuideCompanionPanelHeader
        error={error}
        messages={messages}
        onClearHistory={onClearHistory}
        onClose={onClose}
        surface={surface}
      />
      <Conversation className="min-h-0 flex-1">
        <ConversationContent
          className="gap-4 px-3 py-3"
          scrollClassName="overflow-y-auto overscroll-contain touch-pan-y"
        >
          {messages.length > 0 ? (
            <ProjectGuideCompanionMessageList
              isBusy={isBusy}
              messages={messages}
              onDemoNavigate={onClose}
            />
          ) : null}
          {error ? (
            <div className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-destructive text-xs">
              Project Compass could not answer. Check model setup or try again.
            </div>
          ) : null}
        </ConversationContent>
        <ProjectGuideCompanionScrollButton />
      </Conversation>
      <div className="border-border border-t p-3">
        {messages.length === 0 ? (
          <ProjectGuideCompanionStarterSuggestions
            isBusy={isBusy}
            onSendMessage={onSendMessage}
          />
        ) : null}
        <PromptInput onSubmit={({ text }) => onSendMessage(text)}>
          <PromptInputBody>
            <PromptInputTextarea
              className="max-h-24 min-h-10 text-sm"
              disabled={isBusy}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder="Ask about the project..."
              value={input}
            />
          </PromptInputBody>
          <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-2 py-2">
            <span className="text-muted-foreground text-xs">Project docs</span>
            <PromptInputSubmit
              disabled={!(canSend || isBusy)}
              onStop={onStop}
              status={status}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  );
}

export function ProjectGuideCompanionScrollButton() {
  return (
    <ConversationScrollButton
      aria-label="Scroll companion conversation to bottom"
      className="bottom-3 z-10"
      title="Scroll to bottom"
    />
  );
}

function ProjectGuideCompanionPanelHeader({
  error,
  messages,
  onClearHistory,
  onClose,
  surface,
}: {
  error: Error | undefined;
  messages: UIMessage[];
  onClearHistory: () => void;
  onClose: () => void;
  surface: ProjectGuideCompanionSurface;
}) {
  return (
    <header className="flex items-start justify-between gap-3 border-border border-b px-3 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center border border-border bg-muted">
          <Compass className="size-4" />
        </div>
        <div className="min-w-0">
          <h2 className="truncate font-medium text-sm">Project Compass</h2>
          <p className="truncate text-muted-foreground text-xs">
            {getLauncherLabel(surface)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <ProjectGuideCompanionClearMenu
          disabled={messages.length === 0 && !error}
          onClearHistory={onClearHistory}
        />
        <Button
          aria-label="Close project guide companion"
          onClick={onClose}
          size="icon-sm"
          title="Close"
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      </div>
    </header>
  );
}

function ProjectGuideCompanionClearMenu({
  disabled,
  onClearHistory,
}: {
  disabled: boolean;
  onClearHistory: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Clear companion history"
        className={buttonVariants({ size: "icon-sm", variant: "ghost" })}
        disabled={disabled}
        title="Clear history"
        type="button"
      >
        <Trash2 />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Clear this session?</DropdownMenuLabel>
          <div className="px-2 pb-2 text-muted-foreground text-xs/relaxed">
            This clears Project Compass history in this tab. It cannot be
            undone.
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Cancel</DropdownMenuItem>
          <DropdownMenuItem
            onClick={onClearHistory}
            onSelect={onClearHistory}
            variant="destructive"
          >
            <Trash2 />
            Clear history
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectGuideCompanionStarterSuggestions({
  isBusy,
  onSendMessage,
}: {
  isBusy: boolean;
  onSendMessage: (text: string) => void;
}) {
  return (
    <div className="mb-3 space-y-2">
      <p className="text-muted-foreground text-xs">
        Need bearings? Ask where to start.
      </p>
      <Suggestions className="flex w-full flex-col items-stretch gap-2 whitespace-normal">
        {projectGuideCompanionStarterPrompts.map((prompt) => (
          <Suggestion
            className="h-auto min-h-8 w-full justify-start whitespace-normal rounded-none px-2 py-1.5 text-left"
            disabled={isBusy}
            key={prompt}
            onClick={onSendMessage}
            suggestion={prompt}
            variant="outline"
          >
            <Compass className="size-3.5" />
            <span className="min-w-0">{prompt}</span>
          </Suggestion>
        ))}
      </Suggestions>
    </div>
  );
}

function ProjectGuideCompanionLauncher({
  onDismissReveal,
  onOpen,
  showReveal,
  surface,
}: {
  onDismissReveal: () => void;
  onOpen: () => void;
  showReveal: boolean;
  surface: ProjectGuideCompanionSurface;
}) {
  return (
    <>
      {showReveal ? (
        <div className="fixed right-3 bottom-16 z-50 w-[min(18rem,calc(100vw-1.5rem))] border border-foreground bg-foreground px-3 py-2 text-background shadow-lg sm:right-4 sm:bottom-20">
          <div className="flex items-start gap-2">
            <Compass className="mt-0.5 size-4 shrink-0" />
            <p className="min-w-0 flex-1 text-sm">
              Lots to explore here. I can help you find the fastest path in.
            </p>
            <Button
              aria-label="Dismiss companion greeting"
              className="-mt-1 -mr-1 text-background hover:bg-background/15 hover:text-background focus-visible:ring-background/50"
              onClick={onDismissReveal}
              size="icon-xs"
              title="Dismiss"
              type="button"
              variant="ghost"
            >
              <X />
            </Button>
          </div>
        </div>
      ) : null}
      <Button
        aria-label="Open project guide companion"
        className={cn(
          "fixed right-3 bottom-3 z-50 shadow-lg sm:right-4 sm:bottom-4",
          surface === "demo" ? "size-10" : "size-12"
        )}
        onClick={onOpen}
        title="Open Project Compass"
        type="button"
      >
        <Compass className={surface === "demo" ? "size-4" : "size-5"} />
      </Button>
    </>
  );
}
