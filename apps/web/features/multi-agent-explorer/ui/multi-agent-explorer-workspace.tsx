"use client";

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
  BookOpenIcon,
  CompassIcon,
  FileTextIcon,
  ListChecksIcon,
  RefreshCwIcon,
  SearchIcon,
  SquareIcon,
  WaypointsIcon,
} from "lucide-react";
import { DemoConversation } from "@/components/demo-conversation";
import { PageText, usePageCopy } from "@/components/page-copy";

import {
  ConversationErrorMessage,
  useConversationErrorRetry,
} from "@/features/shared/chat/ui/conversation-error-message";

import type { MultiAgentExplorerUIMessage } from "../types";
import { projectMultiAgentExplorerMessage } from "./message-parts";
import {
  ExplorerTaskCard,
  OrchestrationPhaseSteps,
  ResearchPlanCard,
} from "./orchestration-view";
import { useMultiAgentExplorer } from "./use-multi-agent-explorer";

const samplePrompts = [
  "When should a lead agent fan out to parallel subagents instead of handling research itself?",
  "Compare orchestrator-worker fan-out with a sequential pipeline for a research assistant.",
  "How should a lead agent synthesize findings when explorers disagree?",
] as const;

export interface MultiAgentExplorerWorkspaceProps {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
}

export function MultiAgentExplorerWorkspace({
  chatModel,
  isChatAvailable,
  nodeVersion,
  setupMessage,
}: MultiAgentExplorerWorkspaceProps) {
  const pageCopy = usePageCopy();

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
  } = useMultiAgentExplorer();
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

        <DemoConversation className="min-h-0">
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
            {hasMessages || error ? (
              <>
                {messages.map((message) => (
                  <ExplorerMessage
                    isBusy={isBusy}
                    isLast={message.id === messages.at(-1)?.id}
                    key={message.id}
                    message={message}
                  />
                ))}
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
                description={pageCopy(
                  "Ask a research question. The lead agent will decompose it into subtopics, fan them out to parallel explorer subagents, then synthesize a report while you watch the fan-out happen."
                )}
                icon={<WaypointsIcon className="size-5" />}
                title={pageCopy("One lead, many explorers")}
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </DemoConversation>

        <Separator />
        <div className="px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput onSubmit={({ text }) => sendMessage({ text })}>
              <PromptInputBody>
                <PromptInputTextarea
                  disabled={!isChatAvailable || isBusy}
                  placeholder={pageCopy(
                    "Ask a research question for the lead to fan out to explorer subagents."
                  )}
                />
              </PromptInputBody>
              <Separator className="mt-3" />
              <PromptInputFooter className="flex items-center justify-between gap-3 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    <PageText>{"Lead orchestrator"}</PageText>
                  </Badge>
                  <Badge variant="outline">
                    <PageText>{"2–4 explorers"}</PageText>
                  </Badge>
                  <Badge variant="outline">
                    <PageText>{"Mock corpus"}</PageText>
                  </Badge>
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
                      <PageText>{"Stop"}</PageText>
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
                      <PageText>{"Retry"}</PageText>
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
                    className="h-auto min-h-16 max-w-full justify-start whitespace-normal px-3 py-2 text-left text-xs/relaxed"
                    disabled={!isChatAvailable || isBusy}
                    key={prompt}
                    onClick={() => sendMessage({ text: prompt })}
                    type="button"
                    variant="outline"
                  >
                    <CompassIcon className="size-3.5 shrink-0" />
                    <PageText>{prompt}</PageText>
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
              <PageText>{"Lead → fan-out → synthesize"}</PageText>
            </p>
            <p className="mt-2 text-muted-foreground text-sm/relaxed">
              <PageText>
                {
                  "A hand-rolled orchestration layer on the Vercel AI SDK. One lead agent plans, explorer subagents run their own tool loops in parallel, and the lead merges their findings."
                }
              </PageText>
            </p>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <ListChecksIcon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium text-sm">
                  <PageText>{"Plan"}</PageText>
                </p>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {
                      "The lead decomposes the question into 2–4 disjoint subtopics with generateObject."
                    }
                  </PageText>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <WaypointsIcon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium text-sm">
                  <PageText>{"Fan-out"}</PageText>
                </p>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {
                      "Each subtopic gets an explorer subagent with isolated context and its own streamText loop."
                    }
                  </PageText>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <FileTextIcon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium text-sm">
                  <PageText>{"Synthesize"}</PageText>
                </p>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {
                      "The lead streams a report built from the explorers' compact findings."
                    }
                  </PageText>
                </p>
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <p className="font-heading text-muted-foreground text-xs uppercase tracking-[0.16em]">
              <PageText>{"Explorer tools"}</PageText>
            </p>
            <div className="flex items-start gap-2">
              <SearchIcon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium text-sm">
                  <PageText>{"search_notes"}</PageText>
                </p>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {
                      "Scored keyword lookup over a deterministic agent-design corpus."
                    }
                  </PageText>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <BookOpenIcon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium text-sm">
                  <PageText>{"read_note"}</PageText>
                </p>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {"Reads one note in full so explorers can cite it."}
                  </PageText>
                </p>
              </div>
            </div>
          </div>
          <Separator />
          <div>
            <p className="font-heading text-muted-foreground text-xs uppercase tracking-[0.16em]">
              <PageText>{"Runtime"}</PageText>
            </p>
            <p className="mt-1 font-medium text-sm">{nodeVersion}</p>
            <p className="mt-1 break-all font-mono text-muted-foreground text-xs">
              {chatModel}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface ExplorerMessageProps {
  isBusy: boolean;
  isLast: boolean;
  message: MultiAgentExplorerUIMessage;
}

function ExplorerMessage({ isBusy, isLast, message }: ExplorerMessageProps) {
  const projection = projectMultiAgentExplorerMessage(message);
  const hasOrchestrationParts =
    projection.orchestration !== undefined ||
    projection.plan !== undefined ||
    projection.explorerParts.length > 0;

  return (
    <Message from={message.role}>
      <MessageContent
        className={cn(
          "space-y-3",
          message.role === "assistant" ? "max-w-3xl" : "max-w-2xl"
        )}
      >
        {projection.orchestration ? (
          <OrchestrationPhaseSteps
            detail={projection.orchestration.detail}
            explorerCount={projection.explorerParts.length}
            phase={projection.orchestration.phase}
          />
        ) : null}
        {projection.plan ? <ResearchPlanCard plan={projection.plan} /> : null}
        {projection.explorerParts.map((explorer) => (
          <ExplorerTaskCard explorer={explorer} key={explorer.explorerId} />
        ))}
        {projection.hasReasoningSignal ? (
          <Reasoning isStreaming={isBusy && isLast}>
            <ReasoningTrigger />
            <ReasoningContent>{projection.reasoningText}</ReasoningContent>
          </Reasoning>
        ) : null}
        {projection.text ? (
          <MessageResponse>{projection.text}</MessageResponse>
        ) : null}
        {projection.text || hasOrchestrationParts ? null : (
          <p className="text-muted-foreground text-sm">
            <PageText>{"Waiting for visible output."}</PageText>
          </p>
        )}
      </MessageContent>
    </Message>
  );
}
