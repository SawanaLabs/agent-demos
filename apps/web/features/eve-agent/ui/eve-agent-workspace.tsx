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
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";
import {
  ActivityIcon,
  BotIcon,
  CheckCircle2Icon,
  CircleDotDashedIcon,
  MapPinIcon,
  OrbitIcon,
  RefreshCwIcon,
  SquareIcon,
  WrenchIcon,
} from "lucide-react";

import {
  ConversationErrorMessage,
  useConversationErrorRetry,
} from "@/features/shared/chat/ui/conversation-error-message";

import {
  type ProjectedToolPart,
  projectEveAgentMessage,
} from "./message-parts";
import { useEveAgent } from "./use-eve-agent";

const samplePrompts = [
  "Is the billing service affected by an incident right now?",
  "Which team owns the search service, and is its region healthy?",
  "Compare the regions hosting billing and media-pipeline.",
] as const;

const eveStatusLabels = {
  failed: "eve package failed to load",
  missing: "eve package not installed",
  ready: "eve package loaded",
} as const;

function getToolStatusLabel(state: string) {
  if (state === "output-available") {
    return "Completed";
  }
  if (state === "output-error") {
    return "Failed";
  }
  if (state === "input-available") {
    return "Waiting";
  }
  return "Running";
}

function ToolStatusBadge({ state }: { state: string }) {
  const isCompleted = state === "output-available";

  return (
    <Badge className="gap-1" variant="outline">
      {isCompleted ? (
        <CheckCircle2Icon className="size-3 text-primary" />
      ) : (
        <CircleDotDashedIcon className="size-3 text-muted-foreground" />
      )}
      {getToolStatusLabel(state)}
    </Badge>
  );
}

function ToolCallCard({ part }: { part: ProjectedToolPart }) {
  const outputError =
    part.output && typeof part.output === "object" && "error" in part.output
      ? String(part.output.error)
      : null;

  return (
    <div className="rounded-lg border bg-muted/25 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-background">
            <WrenchIcon className="size-4" />
          </span>
          <div>
            <p className="font-medium font-mono text-sm">{part.toolName}</p>
            <p className="text-muted-foreground text-xs">
              One step of the eve agent loop.
            </p>
          </div>
        </div>
        <ToolStatusBadge state={part.state} />
      </div>
      <div className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2">
        <div>
          <p className="text-muted-foreground text-xs">Input</p>
          <pre className="mt-1 overflow-x-auto rounded-md bg-background p-2 font-mono text-xs">
            {JSON.stringify(part.input ?? null, null, 2)}
          </pre>
        </div>
        {part.output === undefined ? null : (
          <div>
            <p className="text-muted-foreground text-xs">Output</p>
            {outputError ? (
              <p className="mt-1 text-destructive text-xs/relaxed">
                {outputError}
              </p>
            ) : (
              <pre className="mt-1 overflow-x-auto rounded-md bg-background p-2 font-mono text-xs">
                {JSON.stringify(part.output, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export interface EveAgentWorkspaceProps {
  chatModel: string;
  eveStatus: "failed" | "missing" | "ready";
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
}

export function EveAgentWorkspace({
  chatModel,
  eveStatus,
  isChatAvailable,
  nodeVersion,
  setupMessage,
}: EveAgentWorkspaceProps) {
  const {
    clearError,
    error,
    hasMessages,
    isBusy,
    messages,
    regenerate,
    sendMessage,
    status,
    stop,
  } = useEveAgent();
  const retryConversationError = useConversationErrorRetry({
    clearError,
    regenerate,
  });

  return (
    <div className="grid min-h-[72svh] gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <Card className="min-h-[72svh] gap-0 overflow-hidden bg-background py-0 text-base text-foreground leading-normal lg:h-full lg:min-h-0">
        {isChatAvailable ? null : (
          <>
            <div className="px-4 py-3 text-muted-foreground text-xs/relaxed">
              {setupMessage}
            </div>
            <Separator />
          </>
        )}

        <Conversation className="min-h-0">
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
            {hasMessages || error ? (
              <>
                {messages.map((message) => {
                  const projection = projectEveAgentMessage(message);

                  return (
                    <Message from={message.role} key={message.id}>
                      <MessageContent
                        className={cn(
                          "space-y-3",
                          message.role === "assistant"
                            ? "max-w-3xl"
                            : "max-w-2xl"
                        )}
                      >
                        {projection.hasReasoningSignal ? (
                          <Reasoning
                            isStreaming={
                              isBusy && message.id === messages.at(-1)?.id
                            }
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>
                              {projection.reasoningText}
                            </ReasoningContent>
                          </Reasoning>
                        ) : null}
                        {projection.toolParts.map((part) => (
                          <ToolCallCard key={part.toolCallId} part={part} />
                        ))}
                        {projection.text ? (
                          <MessageResponse>{projection.text}</MessageResponse>
                        ) : null}
                        {projection.text ||
                        projection.toolParts.length > 0 ? null : (
                          <p className="text-muted-foreground text-sm">
                            Waiting for visible output.
                          </p>
                        )}
                      </MessageContent>
                    </Message>
                  );
                })}
                {error ? (
                  <ConversationErrorMessage
                    error={error}
                    isRetryDisabled={isBusy || !isChatAvailable}
                    onRetry={retryConversationError}
                  />
                ) : null}
              </>
            ) : (
              <ConversationEmptyState
                description="Ask whether a service is affected. The agent looks up the service, checks its region's health, and answers — each tool call is one visible step of the eve agent loop."
                icon={<OrbitIcon className="size-5" />}
                title="Watch the eve agent loop run"
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
                  placeholder="Ask about a service, its region, or current health."
                />
              </PromptInputBody>
              <Separator className="mt-3" />
              <PromptInputFooter className="flex items-center justify-between gap-3 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">eve (beta)</Badge>
                  <Badge variant="outline">lookup_service</Badge>
                  <Badge variant="outline">check_region</Badge>
                </div>
                <div className="flex items-center gap-2">
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
              <div className="mt-3 grid gap-2 md:grid-cols-3">
                {samplePrompts.map((prompt) => (
                  <Button
                    className="h-auto min-h-16 justify-start whitespace-normal px-3 py-2 text-left text-xs/relaxed"
                    disabled={!isChatAvailable || isBusy}
                    key={prompt}
                    onClick={() => sendMessage({ text: prompt })}
                    type="button"
                    variant="outline"
                  >
                    <BotIcon className="size-3.5 shrink-0" />
                    {prompt}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="bg-background p-4 text-base text-foreground leading-normal lg:min-h-0 lg:overflow-y-auto lg:pr-24">
        <div className="space-y-5">
          <div>
            <p className="font-heading text-muted-foreground text-xs uppercase tracking-[0.16em]">
              Eve agent loop
            </p>
            <p className="mt-2 text-muted-foreground text-sm/relaxed">
              Each turn runs Vercel&apos;s eve framework: the model plans a
              step, calls a tool, observes the result, and repeats until it can
              answer.
            </p>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <ActivityIcon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium text-sm">lookup_service</p>
                <p className="text-muted-foreground text-xs/relaxed">
                  Directory lookup: owner, tier, and home region.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium text-sm">check_region</p>
                <p className="text-muted-foreground text-xs/relaxed">
                  Fixture health feed; eu-west is currently degraded.
                </p>
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <p className="font-heading text-muted-foreground text-xs uppercase tracking-[0.16em]">
              Runtime
            </p>
            <p className="mt-1 font-medium text-sm">{nodeVersion}</p>
            <p className="mt-1 break-all font-mono text-muted-foreground text-xs">
              {chatModel}
            </p>
            <p className="mt-1 text-muted-foreground text-xs">
              {eveStatusLabels[eveStatus]}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
