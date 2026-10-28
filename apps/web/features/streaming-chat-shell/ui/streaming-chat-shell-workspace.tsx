"use client";

import { Chat, useChat } from "@ai-sdk/react";
import {
  ArrowClockwiseIcon,
  BroadcastIcon,
  CaretDownIcon,
  RobotIcon,
  StopIcon,
} from "@phosphor-icons/react";
import {
  ConversationContent,
  ConversationEmptyState,
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
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import { cn } from "@workspace/ui/lib/utils";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DemoConversation } from "@/components/demo-conversation";
import { PageText, usePageCopy } from "@/components/page-copy";
import { ConversationErrorMessage } from "@/features/shared/chat/ui/conversation-error-message";

import type { StreamingAudience } from "../server/contract";
import {
  getReplayPromptEntries,
  type ReplayPromptEntry,
  useStreamingReplayPrompt,
} from "./streaming-replay";

function getTextContent(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function getAudienceLabel(audience: StreamingAudience) {
  switch (audience) {
    case "buyers":
      return "Buyers";
    case "support":
      return "Support";
    default:
      return "Engineers";
  }
}

const streamingChatShellSamplePrompts = [
  "Explain why replaying the same prompt turn is useful for developer debugging.",
  "Draft a support-facing answer and include the custom audience context.",
  "Show what changes between a buyer response and an engineer response.",
] as const;

interface StreamingChatShellWorkspaceProps {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  supportedAudiences: string[];
}

interface StreamingTranscriptProps {
  audience: StreamingAudience;
  chat: Chat<UIMessage>;
  isChatAvailable: boolean;
  setupMessage: string | null;
}

interface StreamingComposerProps {
  audience: StreamingAudience;
  chat: Chat<UIMessage>;
  chatModel: string;
  isChatAvailable: boolean;
  onAudienceChange: (audience: StreamingAudience) => void;
  supportedAudiences: StreamingAudience[];
}

interface StreamingDeveloperTraceProps {
  audience: StreamingAudience;
  chat: Chat<UIMessage>;
}

interface ReplayPromptCardProps {
  audience: StreamingAudience;
  defaultOpen?: boolean;
  entry: ReplayPromptEntry;
  title: string;
}

function StreamingTranscript({
  audience,
  chat,
  isChatAvailable,
  setupMessage,
}: StreamingTranscriptProps) {
  const pageCopy = usePageCopy();

  const { clearError, error, messages, regenerate, status } = useChat({ chat });
  const hasMessages = messages.length > 0;
  const isBusy = status === "submitted" || status === "streaming";
  const retryConversationError = useCallback(async () => {
    clearError();
    await regenerate({ body: { audience } });
  }, [audience, clearError, regenerate]);

  return (
    <>
      {isChatAvailable ? null : (
        <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
          {setupMessage}
        </div>
      )}

      <DemoConversation className="min-h-0">
        <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
          {hasMessages || error ? (
            <>
              {messages.map((message) => {
                const text = getTextContent(message);

                return (
                  <Message from={message.role} key={message.id}>
                    <MessageContent
                      className={cn(
                        message.role === "assistant" ? "max-w-3xl" : "max-w-2xl"
                      )}
                    >
                      {text ? (
                        <MessageResponse>{text}</MessageResponse>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          <PageText>{"Waiting for visible output."}</PageText>
                        </p>
                      )}
                    </MessageContent>
                  </Message>
                );
              })}

              {error ? (
                <ConversationErrorMessage
                  error={error}
                  isRetryDisabled={!isChatAvailable || isBusy}
                  onRetry={retryConversationError}
                />
              ) : null}
            </>
          ) : (
            <ConversationEmptyState
              description={pageCopy(
                "Send a prompt, then inspect how the same chat history can be replayed as a developer-side SSE trace."
              )}
              icon={<RobotIcon className="size-5" />}
              title={pageCopy("Developer replay shell is ready")}
            />
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </DemoConversation>
    </>
  );
}

function StreamingComposer({
  audience,
  chat,
  chatModel,
  isChatAvailable,
  onAudienceChange,
  supportedAudiences,
}: StreamingComposerProps) {
  const pageCopy = usePageCopy();

  const { messages, regenerate, sendMessage, status, stop } = useChat({ chat });
  const hasMessages = messages.length > 0;
  const isBusy = status === "submitted" || status === "streaming";

  async function handleSend(text: string) {
    const trimmedText = text.trim();

    if (!trimmedText) {
      return;
    }

    await sendMessage(
      {
        text: trimmedText,
      },
      {
        body: { audience },
      }
    );
  }

  return (
    <div className="border-foreground/10 border-t px-4 py-4">
      <div className="mx-auto w-full max-w-3xl space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {supportedAudiences.map((option) => {
            const isActive = option === audience;

            return (
              <Button
                className="h-8 px-3 text-xs"
                key={option}
                onClick={() => onAudienceChange(option)}
                size="sm"
                type="button"
                variant={isActive ? "default" : "outline"}
              >
                {getAudienceLabel(option)}
              </Button>
            );
          })}
        </div>

        <PromptInput onSubmit={({ text }) => handleSend(text)}>
          <PromptInputBody>
            <PromptInputTextarea
              disabled={!isChatAvailable || isBusy}
              placeholder={pageCopy(
                "Send a prompt, then inspect the replay trace on the right."
              )}
            />
          </PromptInputBody>
          <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                <PageText>{"Custom body"}</PageText>
              </Badge>
              <Badge variant="outline">
                <PageText>{"Shared useChat"}</PageText>
              </Badge>
              <Badge variant="outline">{chatModel}</Badge>
            </div>
            <div className="flex items-center gap-2">
              {isBusy ? (
                <Button
                  onClick={stop}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <StopIcon className="size-3.5" />
                  <PageText>{"Stop"}</PageText>
                </Button>
              ) : null}
              {hasMessages ? (
                <Button
                  onClick={() => regenerate({ body: { audience } })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ArrowClockwiseIcon className="size-3.5" />
                  <PageText>{"Retry"}</PageText>
                </Button>
              ) : null}
              <PromptInputSubmit disabled={!isChatAvailable} status={status} />
            </div>
          </PromptInputFooter>
        </PromptInput>

        {hasMessages ? null : (
          <div className="flex flex-wrap gap-2">
            {streamingChatShellSamplePrompts.map((prompt) => (
              <Button
                className="h-auto max-w-full whitespace-normal text-left"
                key={prompt}
                onClick={() => {
                  handleSend(prompt);
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                <BroadcastIcon className="size-3.5" />
                <PageText>{prompt}</PageText>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReplayPromptCard({
  audience,
  defaultOpen = false,
  entry,
  title,
}: ReplayPromptCardProps) {
  const { error, events, isReplayable, status, traceText, replayPrompt } =
    useStreamingReplayPrompt(audience, entry);

  return (
    <Collapsible
      className="border border-foreground/10"
      defaultOpen={defaultOpen}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-3 py-3 text-left">
        <div className="space-y-1">
          <p className="font-medium text-sm">{title}</p>
          <p className="line-clamp-3 text-muted-foreground text-xs/relaxed">
            {entry.promptText}
          </p>
        </div>
        <CaretDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4 border-foreground/10 border-t px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{getAudienceLabel(audience)}</Badge>
          <Badge variant="outline">
            {entry.replayMessages.length}
            <PageText>{" messages"}</PageText>
          </Badge>
          {events.length > 0 ? (
            <Badge variant="outline">
              {events.length}
              <PageText>{" events"}</PageText>
            </Badge>
          ) : null}
        </div>

        <div className="space-y-2">
          <Button
            disabled={!isReplayable || status === "loading"}
            onClick={replayPrompt}
            size="sm"
            type="button"
            variant="outline"
          >
            <BroadcastIcon className="size-3.5" />
            <PageText>{"Replay prompt turn"}</PageText>
          </Button>
          <p className="text-muted-foreground text-xs/relaxed">
            <PageText>{'Correlated user prompt: "'}</PageText>
            {entry.promptText}"
          </p>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-destructive text-xs/relaxed">
            {error}
          </div>
        ) : null}

        {status === "loading" ? (
          <p className="text-muted-foreground text-xs/relaxed">
            <PageText>{"Reading the custom event stream..."}</PageText>
          </p>
        ) : null}

        {traceText ? (
          <div className="space-y-2">
            <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              <PageText>{"Reconstructed text"}</PageText>
            </p>
            <div className="rounded-md bg-muted/50 px-3 py-3 text-sm/relaxed">
              {traceText}
            </div>
          </div>
        ) : null}

        {events.length > 0 ? (
          <Collapsible
            className="border border-foreground/10"
            defaultOpen={false}
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-3 py-2 text-left">
              <div className="space-y-1">
                <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                  <PageText>{"Parsed events"}</PageText>
                </p>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {
                      "Inspect the raw replay events only when you need the full sequence."
                    }
                  </PageText>
                </p>
              </div>
              <CaretDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-2 border-foreground/10 border-t px-3 py-3">
              {events.map((event, index) => (
                <div
                  className="rounded-md border border-foreground/10 px-3 py-2 text-xs/relaxed"
                  key={`${event.type}-${index}`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="font-medium">{event.type}</span>
                    {event.type === "start" ? (
                      <Badge variant="outline">
                        {getAudienceLabel(event.audience)}
                      </Badge>
                    ) : null}
                  </div>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words text-muted-foreground">
                    {JSON.stringify(event, null, 2)}
                  </pre>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

function StreamingDeveloperTrace({
  audience,
  chat,
}: StreamingDeveloperTraceProps) {
  const pageCopy = usePageCopy();

  const { messages } = useChat({ chat });
  const replayEntries = useMemo(
    () => getReplayPromptEntries(messages),
    [messages]
  );
  const latestEntry = replayEntries[0] ?? null;
  const historyEntries = replayEntries.slice(1);
  const hasMessages = messages.length > 0;

  return (
    <Collapsible className="border border-foreground/10" defaultOpen={false}>
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left">
        <div className="space-y-1">
          <p className="font-medium text-sm">
            <PageText>{"Replayable developer trace"}</PageText>
          </p>
          <p className="text-muted-foreground text-xs/relaxed">
            <PageText>
              {
                "Replay assistant turns from the thread state that existed at each user prompt."
              }
            </PageText>
          </p>
        </div>
        <CaretDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4 border-foreground/10 border-t px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{getAudienceLabel(audience)}</Badge>
          <Badge variant="outline">
            {messages.length}
            <PageText>{" thread messages"}</PageText>
          </Badge>
          <Badge variant="outline">
            {replayEntries.length}
            <PageText>{" user prompts"}</PageText>
          </Badge>
        </div>

        {hasMessages ? null : (
          <p className="text-muted-foreground text-xs/relaxed">
            <PageText>
              {"Send a prompt to generate replayable prompt turns."}
            </PageText>
          </p>
        )}

        {latestEntry ? (
          <div className="space-y-2">
            <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              <PageText>{"Correlated user prompt"}</PageText>
            </p>
            <ReplayPromptCard
              audience={audience}
              defaultOpen
              entry={latestEntry}
              title={pageCopy("Correlated user prompt")}
            />
          </div>
        ) : null}

        {historyEntries.length > 0 ? (
          <div className="space-y-2">
            <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              <PageText>{"History prompt"}</PageText>
            </p>
            <div className="space-y-3">
              {historyEntries.map((entry) => (
                <ReplayPromptCard
                  audience={audience}
                  entry={entry}
                  key={entry.id}
                  title={pageCopy("History prompt")}
                />
              ))}
            </div>
          </div>
        ) : null}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function StreamingChatShellWorkspace({
  chatModel,
  isChatAvailable,
  nodeVersion,
  setupMessage,
  supportedAudiences,
}: StreamingChatShellWorkspaceProps) {
  const normalizedAudiences = supportedAudiences as StreamingAudience[];
  const [audience, setAudience] = useState<StreamingAudience>(
    normalizedAudiences[0] ?? "engineers"
  );
  const [chat] = useState(
    () =>
      new Chat({
        transport: new DefaultChatTransport({
          api: "/api/demos/streaming-chat-shell",
        }),
      })
  );

  useEffect(
    () => () => {
      chat.stop();
    },
    [chat]
  );

  return (
    <div className="grid min-h-[70svh] gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex min-h-[70svh] flex-col border border-foreground/10 bg-background lg:h-full lg:min-h-0">
        <StreamingTranscript
          audience={audience}
          chat={chat}
          isChatAvailable={isChatAvailable}
          setupMessage={setupMessage}
        />
        <StreamingComposer
          audience={audience}
          chat={chat}
          chatModel={chatModel}
          isChatAvailable={isChatAvailable}
          onAudienceChange={setAudience}
          supportedAudiences={normalizedAudiences}
        />
      </section>

      <aside className="space-y-4 lg:min-h-0 lg:overflow-y-auto">
        <section className="border border-foreground/10 bg-background p-4">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                <PageText>{"Runtime"}</PageText>
              </p>
              <p className="mt-1 font-medium text-sm">{nodeVersion}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                <PageText>{"Request contract"}</PageText>
              </p>
              <p className="mt-1 text-sm">
                <PageText>
                  {
                    "Each request can carry feature-local metadata, while the main chat surface stays on the shared AI SDK transport contract."
                  }
                </PageText>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                <PageText>{"Shared state"}</PageText>
              </p>
              <p className="mt-1 text-sm">
                <PageText>
                  {
                    "Transcript, composer, retry flow, and replay trace all read from the same `Chat` instance."
                  }
                </PageText>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                <PageText>{"Developer value"}</PageText>
              </p>
              <p className="mt-1 text-sm">
                <PageText>
                  {
                    "The same conversation can be replayed as a plain SSE stream for debugging, inspection, and secondary developer tooling."
                  }
                </PageText>
              </p>
            </div>
          </div>
        </section>

        <StreamingDeveloperTrace audience={audience} chat={chat} />
      </aside>
    </div>
  );
}
