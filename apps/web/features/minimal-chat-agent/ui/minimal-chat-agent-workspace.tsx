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
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@workspace/ui/components/ai-elements/sources";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { cn } from "@workspace/ui/lib/utils";
import {
  BotIcon,
  CheckCircle2Icon,
  CircleDotDashedIcon,
  GitForkIcon,
  MessageCircleQuestionIcon,
  RefreshCwIcon,
  SearchIcon,
  SquareIcon,
  StarIcon,
  WorkflowIcon,
} from "lucide-react";
import { PageText, usePageCopy } from "@/components/page-copy";

import {
  ConversationErrorMessage,
  useConversationErrorRetry,
} from "@/features/shared/chat/ui/conversation-error-message";

import type { AskUserOutput } from "../server/tools";
import { AskUserCard } from "./ask-user-card";
import {
  findPendingAskUserPart,
  type ProjectedAskUserPart,
  type ProjectedGithubRepoPart,
  type ProjectedWebSearchPart,
  projectMinimalChatAgentMessage,
} from "./message-parts";
import { useMinimalChatAgent } from "./use-minimal-chat-agent";

const samplePrompts = [
  "Look up shadcn-ui/chatbot-template on GitHub and explain what makes it a minimal agent.",
  "Search the web for current human-in-the-loop chat UI patterns and cite the sources.",
  "Help me choose an agent starter. Ask me clarifying questions before you recommend one.",
] as const;

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

function WebSearchCard({ part }: { part: ProjectedWebSearchPart }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/25 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-md border bg-background">
          <SearchIcon className="size-4" />
        </span>
        <div>
          <p className="font-medium text-sm">
            <PageText>{"Provider-native web search"}</PageText>
          </p>
          <p className="text-muted-foreground text-xs">
            <PageText>{"Retrieval runs inside the model provider."}</PageText>
          </p>
        </div>
      </div>
      <ToolStatusBadge state={part.state} />
    </div>
  );
}

function GithubRepoCard({ part }: { part: ProjectedGithubRepoPart }) {
  const result = part.output && "repo" in part.output ? part.output : null;
  const errorMessage =
    part.output && "error" in part.output ? part.output.error : null;

  return (
    <div className="rounded-lg border bg-muted/25 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-md border bg-background">
            <GitForkIcon className="size-4" />
          </span>
          <div>
            <p className="font-medium text-sm">
              {result?.repo ?? part.input.repo}
            </p>
            <p className="mt-0.5 text-muted-foreground text-xs/relaxed">
              {errorMessage ??
                result?.description ??
                "Reading public repository metadata."}
            </p>
          </div>
        </div>
        <ToolStatusBadge state={part.state} />
      </div>
      {result ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3 text-muted-foreground text-xs">
          <a
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href={result.url}
            rel="noreferrer"
            target="_blank"
          >
            <PageText>{"Open repository"}</PageText>
          </a>
          <span className="flex items-center gap-1">
            <StarIcon className="size-3" />
            {result.stars.toLocaleString()}
          </span>
          <span>
            {result.forks.toLocaleString()}
            <PageText>{" forks"}</PageText>
          </span>
          <span>
            {result.openIssues.toLocaleString()}
            <PageText>{" open issues"}</PageText>
          </span>
          <span>{result.language}</span>
        </div>
      ) : null}
    </div>
  );
}

function AnsweredAskUserCard({ part }: { part: ProjectedAskUserPart }) {
  if (!part.output) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-muted/25 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageCircleQuestionIcon className="size-4" />
          <p className="font-medium text-sm">
            <PageText>{"Clarifying answers received"}</PageText>
          </p>
        </div>
        <ToolStatusBadge state={part.state} />
      </div>
      <dl className="mt-3 grid gap-2 border-t pt-3 text-xs sm:grid-cols-2">
        {part.output.map((answer) => (
          <div key={answer.question}>
            <dt className="text-muted-foreground">{answer.question}</dt>
            <dd className="mt-0.5 font-medium">{answer.answer}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export interface MinimalChatAgentWorkspaceProps {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
}

export function MinimalChatAgentWorkspace({
  chatModel,
  isChatAvailable,
  nodeVersion,
  setupMessage,
}: MinimalChatAgentWorkspaceProps) {
  const pageCopy = usePageCopy();

  const {
    addToolOutput,
    clearError,
    error,
    hasMessages,
    isBusy,
    messages,
    regenerate,
    sendMessage,
    status,
    stop,
  } = useMinimalChatAgent();
  const pendingAskUserPart = findPendingAskUserPart(messages);
  const retryConversationError = useConversationErrorRetry({
    clearError,
    regenerate,
  });

  const submitAskUserOutput = async (
    part: ProjectedAskUserPart,
    output: AskUserOutput
  ) => {
    await addToolOutput({
      output,
      tool: "ask_user",
      toolCallId: part.toolCallId,
    });
  };

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
                  const projection = projectMinimalChatAgentMessage(message);
                  const hasToolParts =
                    projection.askUserParts.length > 0 ||
                    projection.githubRepoParts.length > 0 ||
                    projection.webSearchParts.length > 0;

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
                        {projection.webSearchParts.map((part) => (
                          <WebSearchCard key={part.toolCallId} part={part} />
                        ))}
                        {projection.githubRepoParts.map((part) => (
                          <GithubRepoCard key={part.toolCallId} part={part} />
                        ))}
                        {projection.askUserParts.map((part) => (
                          <AnsweredAskUserCard
                            key={part.toolCallId}
                            part={part}
                          />
                        ))}
                        {projection.text ? (
                          <MessageResponse>{projection.text}</MessageResponse>
                        ) : null}
                        {projection.sourceUrlParts.length > 0 ? (
                          <Sources>
                            <SourcesTrigger
                              count={projection.sourceUrlParts.length}
                            />
                            <SourcesContent>
                              {projection.sourceUrlParts.map((source) => (
                                <Source
                                  href={source.url}
                                  key={source.sourceId}
                                  title={source.title ?? source.url}
                                />
                              ))}
                            </SourcesContent>
                          </Sources>
                        ) : null}
                        {projection.text || hasToolParts ? null : (
                          <p className="text-muted-foreground text-sm">
                            <PageText>{"Waiting for visible output."}</PageText>
                          </p>
                        )}
                      </MessageContent>
                    </Message>
                  );
                })}
                {pendingAskUserPart ? (
                  <AskUserCard
                    disabled={isBusy}
                    input={pendingAskUserPart.input}
                    onSubmit={(output) =>
                      submitAskUserOutput(pendingAskUserPart, output)
                    }
                  />
                ) : null}
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
                  "Ask for live information, inspect a public GitHub repository, or let the agent pause for structured clarification."
                )}
                icon={<WorkflowIcon className="size-5" />}
                title={pageCopy("One chat, three tool boundaries")}
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
                  disabled={
                    !isChatAvailable || isBusy || Boolean(pendingAskUserPart)
                  }
                  placeholder={
                    pendingAskUserPart
                      ? pageCopy("Answer the questions above to continue.")
                      : pageCopy(
                          "Ask the agent to search, inspect a repository, or clarify a decision."
                        )
                  }
                />
              </PromptInputBody>
              <Separator className="mt-3" />
              <PromptInputFooter className="flex items-center justify-between gap-3 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    <PageText>{"OpenAI hosted search"}</PageText>
                  </Badge>
                  <Badge variant="outline">
                    <PageText>{"GitHub REST"}</PageText>
                  </Badge>
                  <Badge variant="outline">
                    <PageText>{"HITL"}</PageText>
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
                  {hasMessages && !pendingAskUserPart ? (
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
                    disabled={!isChatAvailable || Boolean(pendingAskUserPart)}
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
                    <BotIcon className="size-3.5 shrink-0" />
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
              <PageText>{"Minimal agent loop"}</PageText>
            </p>
            <p className="mt-2 text-muted-foreground text-sm/relaxed">
              <PageText>
                {
                  "The model chooses tools, receives structured results, and keeps streaming until the task is complete or a human answer is needed."
                }
              </PageText>
            </p>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <SearchIcon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium text-sm">
                  <PageText>{"web_search"}</PageText>
                </p>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {"OpenAI hosted retrieval with streamed source parts."}
                  </PageText>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <GitForkIcon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium text-sm">
                  <PageText>{"github_repo"}</PageText>
                </p>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {"A server tool that reads public repository metadata."}
                  </PageText>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MessageCircleQuestionIcon className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-medium text-sm">
                  <PageText>{"ask_user"}</PageText>
                </p>
                <p className="text-muted-foreground text-xs/relaxed">
                  <PageText>
                    {
                      "An unexecuted tool whose output comes from the questionnaire UI."
                    }
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
