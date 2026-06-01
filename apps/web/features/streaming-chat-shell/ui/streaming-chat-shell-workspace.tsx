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
  Conversation,
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
import { useMemo, useState } from "react";

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
  chat,
  isChatAvailable,
  setupMessage,
}: StreamingTranscriptProps) {
  const { error, messages } = useChat({ chat });
  const hasMessages = messages.length > 0;

  return (
    <>
      {isChatAvailable ? null : (
        <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
          {setupMessage}
        </div>
      )}

      {error ? (
        <div className="border-foreground/10 border-b px-4 py-3 text-destructive text-xs/relaxed">
          {error.message}
        </div>
      ) : null}

      <Conversation className="min-h-0">
        <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
          {hasMessages ? (
            messages.map((message) => {
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
                        Waiting for visible output.
                      </p>
                    )}
                  </MessageContent>
                </Message>
              );
            })
          ) : (
            <ConversationEmptyState
              description="Send a prompt, then inspect how the same chat history can be replayed as a developer-side SSE trace."
              icon={<RobotIcon className="size-5" />}
              title="Developer replay shell is ready"
            />
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
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
              placeholder="Send a prompt, then inspect the replay trace on the right."
            />
          </PromptInputBody>
          <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">Custom body</Badge>
              <Badge variant="outline">Shared useChat</Badge>
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
                  Stop
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
                  Retry
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
                key={prompt}
                onClick={() => {
                  handleSend(prompt);
                }}
                size="sm"
                type="button"
                variant="outline"
              >
                <BroadcastIcon className="size-3.5" />
                {prompt}
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
            {entry.replayMessages.length} messages
          </Badge>
          {events.length > 0 ? (
            <Badge variant="outline">{events.length} events</Badge>
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
            Replay prompt turn
          </Button>
          <p className="text-muted-foreground text-xs/relaxed">
            Correlated user prompt: "{entry.promptText}"
          </p>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-destructive text-xs/relaxed">
            {error}
          </div>
        ) : null}

        {status === "loading" ? (
          <p className="text-muted-foreground text-xs/relaxed">
            Reading the custom event stream...
          </p>
        ) : null}

        {traceText ? (
          <div className="space-y-2">
            <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Reconstructed text
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
                  Parsed events
                </p>
                <p className="text-muted-foreground text-xs/relaxed">
                  Inspect the raw replay events only when you need the full
                  sequence.
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
          <p className="font-medium text-sm">Replayable developer trace</p>
          <p className="text-muted-foreground text-xs/relaxed">
            Replay assistant turns from the thread state that existed at each
            user prompt.
          </p>
        </div>
        <CaretDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent className="space-y-4 border-foreground/10 border-t px-4 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{getAudienceLabel(audience)}</Badge>
          <Badge variant="outline">{messages.length} thread messages</Badge>
          <Badge variant="outline">{replayEntries.length} user prompts</Badge>
        </div>

        {hasMessages ? null : (
          <p className="text-muted-foreground text-xs/relaxed">
            Send a prompt to generate replayable prompt turns.
          </p>
        )}

        {latestEntry ? (
          <div className="space-y-2">
            <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Correlated user prompt
            </p>
            <ReplayPromptCard
              audience={audience}
              defaultOpen
              entry={latestEntry}
              title="Correlated user prompt"
            />
          </div>
        ) : null}

        {historyEntries.length > 0 ? (
          <div className="space-y-2">
            <p className="font-medium text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              History prompt
            </p>
            <div className="space-y-3">
              {historyEntries.map((entry) => (
                <ReplayPromptCard
                  audience={audience}
                  entry={entry}
                  key={entry.id}
                  title="History prompt"
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

  return (
    <div className="grid min-h-[70svh] gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="flex min-h-[70svh] flex-col border border-foreground/10 bg-background lg:h-full lg:min-h-0">
        <StreamingTranscript
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
                Runtime
              </p>
              <p className="mt-1 font-medium text-sm">{nodeVersion}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                Request contract
              </p>
              <p className="mt-1 text-sm">
                Each request can carry feature-local metadata, while the main
                chat surface stays on the shared AI SDK transport contract.
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                Shared state
              </p>
              <p className="mt-1 text-sm">
                Transcript, composer, retry flow, and replay trace all read from
                the same `Chat` instance.
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
                Developer value
              </p>
              <p className="mt-1 text-sm">
                The same conversation can be replayed as a plain SSE stream for
                debugging, inspection, and secondary developer tooling.
              </p>
            </div>
          </div>
        </section>

        <StreamingDeveloperTrace audience={audience} chat={chat} />
      </aside>
    </div>
  );
}
