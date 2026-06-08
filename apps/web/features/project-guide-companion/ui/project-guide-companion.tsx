"use client";

import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@workspace/ui/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@workspace/ui/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@workspace/ui/components/ai-elements/prompt-input";
import { Shimmer } from "@workspace/ui/components/ai-elements/shimmer";
import {
  Suggestion,
  Suggestions,
} from "@workspace/ui/components/ai-elements/suggestion";
import { Badge } from "@workspace/ui/components/badge";
import { Button, buttonVariants } from "@workspace/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
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
import { DefaultChatTransport, isTextUIPart, isToolUIPart } from "ai";
import { ArrowUpRight, ChevronDown, Compass, Trash2, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { prepareProjectGuideCompanionContextMessages } from "../message-history";
import {
  extractProjectGuideCompanionToolLine,
  getProjectGuideCompanionSourceDisplayLabel,
  getProjectGuideCompanionSurface,
  getProjectGuideCompanionTextContent,
  type ProjectGuideCompanionDemoResult,
  type ProjectGuideCompanionSurface,
  type ProjectGuideCompanionToolPart,
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

function ProjectGuideCompanionPanel({
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
      className="fixed inset-x-0 bottom-0 z-50 flex max-h-[82svh] min-h-[520px] flex-col border-border border-t bg-background shadow-2xl sm:inset-auto sm:right-4 sm:bottom-4 sm:h-[min(70vh,640px)] sm:w-[400px] sm:border"
    >
      <ProjectGuideCompanionPanelHeader
        error={error}
        messages={messages}
        onClearHistory={onClearHistory}
        onClose={onClose}
        surface={surface}
      />
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-4 px-3 py-3">
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
        <ConversationScrollButton className="bottom-3" />
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

function ProjectGuideCompanionMessageList({
  isBusy,
  messages,
  onDemoNavigate,
}: {
  isBusy: boolean;
  messages: UIMessage[];
  onDemoNavigate: () => void;
}) {
  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <ProjectGuideCompanionMessage
          key={message.id}
          message={message}
          onDemoNavigate={onDemoNavigate}
        />
      ))}
      {isBusy && messages.at(-1)?.role === "user" ? (
        <Shimmer className="text-sm">Thinking....</Shimmer>
      ) : null}
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

function ProjectGuideCompanionMessage({
  message,
  onDemoNavigate,
}: {
  message: UIMessage;
  onDemoNavigate: () => void;
}) {
  if (message.role === "user") {
    return (
      <Message from="user">
        <MessageContent className="max-w-[88%] rounded-none border border-primary bg-primary px-3 py-2 text-primary-foreground text-sm">
          <MessageResponse>
            {getProjectGuideCompanionTextContent(message)}
          </MessageResponse>
        </MessageContent>
      </Message>
    );
  }

  const textParts = message.parts
    .filter(isTextUIPart)
    .filter((part) => part.text.trim());
  const toolEntries = message.parts.filter(isToolUIPart).map((part, index) => {
    const toolPart = part as ProjectGuideCompanionToolPart;

    return {
      key: part.toolCallId ?? `tool-${index}`,
      part: toolPart,
      toolLine: hasProjectGuideCompanionToolError(toolPart)
        ? null
        : extractProjectGuideCompanionToolLine(toolPart),
    };
  });

  return (
    <Message className="max-w-full" from="assistant">
      <MessageContent className="max-w-[92%] space-y-2 text-sm">
        {toolEntries.map(({ key, part, toolLine }) => (
          <ProjectGuideCompanionToolLine
            key={key}
            part={part}
            toolLine={toolLine}
          />
        ))}
        {textParts.map((part, index) => (
          <MessageResponse key={`text-${index}`}>{part.text}</MessageResponse>
        ))}
        {toolEntries.map(({ key, toolLine }) =>
          toolLine ? (
            <ProjectGuideCompanionDemoResults
              key={`${key}-demo-results`}
              onDemoNavigate={onDemoNavigate}
              results={toolLine.demoResults}
            />
          ) : null
        )}
      </MessageContent>
    </Message>
  );
}

function ProjectGuideCompanionToolLine({
  part,
  toolLine,
}: {
  part: ProjectGuideCompanionToolPart;
  toolLine: ReturnType<typeof extractProjectGuideCompanionToolLine> | null;
}) {
  if (!toolLine) {
    return null;
  }

  const sources = [...toolLine.visibleSources, ...toolLine.hiddenSources];
  const hasInput = part.input !== undefined;
  const hasOutput = part.output !== undefined;

  return (
    <Collapsible className="group">
      <CollapsibleTrigger className="flex min-h-6 w-full items-start gap-1.5 text-left text-muted-foreground text-xs">
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <span className="shrink-0">
            {toolLine.isPending ? (
              <Shimmer as="span">{toolLine.label}</Shimmer>
            ) : (
              toolLine.label
            )}
          </span>
          {sources.map((source) => (
            <Badge
              className="min-w-0 max-w-48 justify-start rounded-none px-1.5 py-0 font-normal"
              key={`${source.label}-${source.line ?? ""}`}
              title={source.label}
              variant="outline"
            >
              <span className="truncate">
                {getProjectGuideCompanionSourceDisplayLabel(source)}
              </span>
            </Badge>
          ))}
        </span>
        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-muted-foreground transition-transform group-data-[state=open]:rotate-180">
          <ChevronDown className="size-3" />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 space-y-1.5 pl-3 text-[11px]">
        {hasInput ? (
          <ProjectGuideCompanionToolDetail label="Input" value={part.input} />
        ) : null}
        {hasOutput ? (
          <ProjectGuideCompanionToolDetail label="Output" value={part.output} />
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

const maxVisibleDemoResults = 4;

function ProjectGuideCompanionDemoResults({
  onDemoNavigate,
  results,
}: {
  onDemoNavigate: () => void;
  results: ProjectGuideCompanionDemoResult[];
}) {
  if (results.length === 0) {
    return null;
  }

  const visibleResults = results.slice(0, maxVisibleDemoResults);
  const hiddenResultCount = results.length - visibleResults.length;

  return (
    <div className="mt-2 space-y-2">
      {visibleResults.map((result) => (
        <ProjectGuideCompanionDemoResultCard
          key={result.href ?? result.slug ?? result.title}
          onDemoNavigate={onDemoNavigate}
          result={result}
        />
      ))}
      {hiddenResultCount > 0 ? (
        <p className="text-muted-foreground text-xs">
          {hiddenResultCount} more demos are available in tool details.
        </p>
      ) : null}
    </div>
  );
}

function ProjectGuideCompanionDemoResultCard({
  onDemoNavigate,
  result,
}: {
  onDemoNavigate: () => void;
  result: ProjectGuideCompanionDemoResult;
}) {
  const content = (
    <Card
      className="gap-2 border border-border bg-muted/20 py-2 ring-0 transition-colors group-hover/demo:bg-muted/40"
      size="sm"
    >
      <CardHeader className="gap-1 px-3">
        <CardTitle className="flex min-w-0 items-center gap-2 text-sm">
          <span className="truncate">{result.title}</span>
        </CardTitle>
        {result.href ? (
          <CardAction>
            <ArrowUpRight className="size-3.5 text-muted-foreground transition-colors group-hover/demo:text-foreground" />
          </CardAction>
        ) : null}
        <CardDescription className="flex flex-wrap gap-1">
          {getProjectGuideCompanionDemoMeta(result).map((label) => (
            <Badge
              className="rounded-none px-1.5 py-0 font-normal"
              key={label}
              variant="outline"
            >
              {label}
            </Badge>
          ))}
        </CardDescription>
      </CardHeader>
      {result.summary ? (
        <CardContent className="px-3">
          <p className="line-clamp-2 text-muted-foreground text-xs/relaxed">
            {result.summary}
          </p>
        </CardContent>
      ) : null}
    </Card>
  );

  if (!result.href) {
    return content;
  }

  return (
    <Link
      className="group/demo block outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      href={result.href}
      onClick={onDemoNavigate}
      prefetch={false}
    >
      {content}
    </Link>
  );
}

function getProjectGuideCompanionDemoMeta(
  result: ProjectGuideCompanionDemoResult
) {
  return [result.status, result.pattern, result.source].filter(
    (label): label is string => Boolean(label)
  );
}

function hasProjectGuideCompanionToolError(
  part: ProjectGuideCompanionToolPart
) {
  return Boolean(part.errorText) || part.state === "output-error";
}

function ProjectGuideCompanionToolDetail({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div className="space-y-1">
      <p className="font-medium text-muted-foreground uppercase">{label}</p>
      <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words border border-border/70 bg-muted/20 p-2 text-foreground">
        {formatProjectGuideCompanionToolDetail(value)}
      </pre>
    </div>
  );
}

function formatProjectGuideCompanionToolDetail(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}
