"use client";

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
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@workspace/ui/components/ai-elements/reasoning";
import { Shimmer } from "@workspace/ui/components/ai-elements/shimmer";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";
import {
  CircleCheckIcon,
  CircleDotDashedIcon,
  GitBranchIcon,
  PlusIcon,
  RefreshCwIcon,
  SquareIcon,
} from "lucide-react";

import type { LangGraphProgressData } from "../server/stream-normalizer";
import { getLangGraphThinkingText } from "./langgraph-agent-message-parts";
import {
  type LangGraphAgentMessage,
  useLangGraphAgent,
} from "./use-langgraph-agent";

const langGraphAgentSamplePrompts = [
  "Plan a safe LangGraph handoff from product research to implementation.",
  "Explain how this thread streams LangGraph node updates into AI SDK UI messages.",
  "Validate the minimum environment setup for running this LangGraph demo locally.",
] as const;

function getTextContent(message: LangGraphAgentMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function getGraphNodeSummary(events: LangGraphProgressData[]) {
  const latestByNode = new Map<string, LangGraphProgressData>();

  for (const event of events) {
    latestByNode.set(event.node, event);
  }

  return Array.from(latestByNode.values());
}

function formatStateSummary(state: unknown) {
  if (typeof state === "string") {
    return state;
  }

  if (typeof state === "object" && state !== null) {
    return JSON.stringify(state);
  }

  return "Stream event received";
}

function LangGraphAssistantTrace({
  events,
  isLastMessage,
  isStreaming,
  message,
}: {
  events: LangGraphProgressData[];
  isLastMessage: boolean;
  isStreaming: boolean;
  message: LangGraphAgentMessage;
}) {
  const text = getTextContent(message);
  const thinkingText = isLastMessage ? getLangGraphThinkingText(events) : "";
  const showThinking =
    thinkingText.length > 0 || (isLastMessage && isStreaming && !text);

  return (
    <>
      {showThinking ? (
        <Reasoning
          className="w-full"
          defaultOpen={isLastMessage && isStreaming}
          isStreaming={isLastMessage && isStreaming}
        >
          <ReasoningTrigger
            getThinkingMessage={(streaming, duration) => {
              if (streaming || duration === 0) {
                return (
                  <Shimmer duration={1}>Thinking through LangGraph...</Shimmer>
                );
              }

              if (duration === undefined) {
                return <p>LangGraph thinking</p>;
              }

              return <p>LangGraph thought for {duration} seconds</p>;
            }}
          />
          <ReasoningContent>
            {thinkingText || "- Start run: Waiting for LangGraph node updates."}
          </ReasoningContent>
        </Reasoning>
      ) : null}

      {text ? (
        <MessageResponse>{text}</MessageResponse>
      ) : (
        <Shimmer className="text-sm">Waiting for LangGraph output.</Shimmer>
      )}
    </>
  );
}

function GraphProgressPanel({
  events,
  threadId,
}: {
  events: LangGraphProgressData[];
  threadId: string | null;
}) {
  const nodeSummary = getGraphNodeSummary(events);
  const threadLabel = threadId ?? "Preparing thread...";

  return (
    <Card className="bg-background p-4 text-base text-foreground leading-normal">
      <div className="space-y-4">
        <div>
          <p className="font-heading text-muted-foreground text-xs uppercase tracking-[0.16em]">
            LangGraph thread
          </p>
          <p className="mt-1 break-all font-mono text-sm">{threadLabel}</p>
        </div>

        <div>
          <p className="font-heading text-muted-foreground text-xs uppercase tracking-[0.16em]">
            Graph progress
          </p>
          <div className="mt-2 space-y-2">
            {nodeSummary.length > 0 ? (
              nodeSummary.map((event) => {
                const isStreaming = event.status === "streaming";

                return (
                  <div
                    className="rounded-md border bg-muted/20 px-3 py-2"
                    key={`${event.kind}-${event.node}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        {isStreaming ? (
                          <CircleDotDashedIcon className="size-4 shrink-0 text-emerald-600" />
                        ) : (
                          <CircleCheckIcon className="size-4 shrink-0 text-emerald-600" />
                        )}
                        <span className="truncate font-medium text-sm">
                          {event.node}
                        </span>
                      </div>
                      <Badge className="shrink-0" variant="outline">
                        {event.source}
                      </Badge>
                    </div>
                    {event.kind === "node-update" ? (
                      <p className="mt-2 line-clamp-2 break-words text-muted-foreground text-xs">
                        {formatStateSummary(event.state)}
                      </p>
                    ) : (
                      <p className="mt-2 text-muted-foreground text-xs">
                        Streaming tokens from run {event.runId ?? "unknown"}
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground text-sm">
                Submit a message to watch LangGraph updates and streamed answer
                tokens land as AI SDK data parts.
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export interface LangGraphAgentWorkspaceProps {
  assistantId: string | null;
  isChatAvailable: boolean;
  nodeVersion: string;
  remoteUrl: string | null;
  setupMessage: string | null;
}

export function LangGraphAgentWorkspace({
  assistantId,
  isChatAvailable,
  nodeVersion,
  remoteUrl,
  setupMessage,
}: LangGraphAgentWorkspaceProps) {
  const {
    error,
    graphEvents,
    hasMessages,
    isBusy,
    messages,
    regenerate,
    sendMessage,
    startNewThread,
    status,
    stop,
    threadId,
  } = useLangGraphAgent();

  return (
    <div className="grid h-[100svh] min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card className="h-full min-h-0 gap-0 overflow-hidden bg-background py-0 text-base text-foreground leading-normal">
        {isChatAvailable ? null : (
          <>
            <div className="px-4 py-3 text-muted-foreground text-xs/relaxed">
              {setupMessage}
            </div>
            <Separator />
          </>
        )}

        {error ? (
          <>
            <div className="px-4 py-3 text-destructive text-xs/relaxed">
              {error.message}
            </div>
            <Separator />
          </>
        ) : null}

        <Conversation>
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
            {hasMessages ? (
              messages.map((message, index) => {
                const text = getTextContent(message);
                let messageBody = (
                  <p className="text-muted-foreground text-sm">
                    Waiting for LangGraph output.
                  </p>
                );

                if (message.role === "assistant") {
                  messageBody = (
                    <LangGraphAssistantTrace
                      events={graphEvents}
                      isLastMessage={index === messages.length - 1}
                      isStreaming={isBusy}
                      message={message}
                    />
                  );
                } else if (text) {
                  messageBody = <MessageResponse>{text}</MessageResponse>;
                }

                return (
                  <Message from={message.role} key={message.id}>
                    <MessageContent
                      className={cn(
                        "space-y-4",
                        message.role === "assistant" ? "max-w-3xl" : "max-w-2xl"
                      )}
                    >
                      {messageBody}
                    </MessageContent>
                  </Message>
                );
              })
            ) : (
              <ConversationEmptyState
                description="Ask the remote LangGraph agent to explain, plan, or validate a product-agent integration path."
                icon={<GitBranchIcon className="size-5" />}
                title="LangGraph thread is ready"
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <Separator />
        <div className="px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput onSubmit={({ text }) => sendMessage({ text })}>
              <PromptInputBody>
                <PromptInputTextarea
                  disabled={!isChatAvailable || isBusy}
                  placeholder="Ask the LangGraph agent to reason through an integration or implementation question."
                />
              </PromptInputBody>
              <Separator className="mt-3" />
              <PromptInputFooter className="flex items-center justify-between gap-3 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">LangGraph</Badge>
                  <Badge variant="outline">AI SDK stream</Badge>
                  <Badge variant="outline">thread scoped</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    disabled={isBusy}
                    onClick={startNewThread}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <PlusIcon className="size-3.5" />
                    New thread
                  </Button>
                  {isBusy ? (
                    <Button
                      onClick={stop}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <SquareIcon className="size-3.5" />
                      Stop
                    </Button>
                  ) : null}
                  {hasMessages ? (
                    <Button
                      onClick={() => regenerate()}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <RefreshCwIcon className="size-3.5" />
                      Retry
                    </Button>
                  ) : null}
                  <PromptInputSubmit
                    disabled={!isChatAvailable}
                    status={status}
                  />
                </div>
              </PromptInputFooter>
            </PromptInput>

            {hasMessages ? null : (
              <div className="mt-3 flex flex-wrap gap-2">
                {langGraphAgentSamplePrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    onClick={() => sendMessage({ text: prompt })}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <GitBranchIcon className="size-3.5" />
                    {prompt}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="min-h-0 space-y-4 overflow-y-auto">
        <Card className="bg-background p-4 text-base text-foreground leading-normal">
          <div className="space-y-4">
            <div>
              <p className="font-heading text-muted-foreground text-xs uppercase tracking-[0.16em]">
                Runtime
              </p>
              <p className="mt-1 font-medium text-sm">{nodeVersion}</p>
            </div>
            <div>
              <p className="font-heading text-muted-foreground text-xs uppercase tracking-[0.16em]">
                Remote API
              </p>
              <p className="mt-1 break-all text-muted-foreground text-sm">
                {remoteUrl ?? "Missing LANGGRAPH_AGENT_API_URL"}
              </p>
            </div>
            <div>
              <p className="font-heading text-muted-foreground text-xs uppercase tracking-[0.16em]">
                Assistant
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                {assistantId ?? "Missing LANGGRAPH_AGENT_ASSISTANT_ID"}
              </p>
            </div>
          </div>
        </Card>

        <GraphProgressPanel events={graphEvents} threadId={threadId} />
      </div>
    </div>
  );
}
