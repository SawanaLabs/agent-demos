"use client";

import { Chat, useChat } from "@ai-sdk/react";
import {
  ArrowClockwiseIcon,
  GitBranchIcon,
  StopIcon,
  WrenchIcon,
} from "@phosphor-icons/react";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtSearchResult,
  ChainOfThoughtSearchResults,
  ChainOfThoughtStep,
} from "@workspace/ui/components/ai-elements/chain-of-thought";
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
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@workspace/ui/components/ai-elements/tool";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import {
  DefaultChatTransport,
  isReasoningUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai";
import { type ReactNode, useMemo, useState } from "react";

import type { SupportTriageResult } from "@/features/loop-agent/server/support-triage";

function getTextContent(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

function getToolParts(message: UIMessage) {
  return message.parts.filter(isToolUIPart);
}

function getReasoningText(message: UIMessage) {
  return message.parts
    .filter(isReasoningUIPart)
    .map((part) => part.text)
    .join("\n\n");
}

function getToolName(part: ToolPart) {
  return part.type === "dynamic-tool"
    ? part.toolName
    : part.type.split("-").slice(1).join("-");
}

function getBatchStatus(toolNames: string[], toolParts: ToolPart[]) {
  const batchParts = toolParts.filter((part) =>
    toolNames.includes(getToolName(part))
  );

  if (batchParts.length === 0) {
    return "pending" as const;
  }

  const isComplete = batchParts.every(
    (part) => part.state === "output-available"
  );

  if (isComplete) {
    return "complete" as const;
  }

  return "active" as const;
}

function getBatchDescription(
  batch: SupportTriageResult["toolBatches"][number],
  triage: SupportTriageResult
) {
  if (batch.execution === "parallel") {
    return `Checks account context in parallel before the SLA decision for ${triage.caseId}.`;
  }

  return `Uses the completed account context to assess SLA risk for ${triage.caseId}.`;
}

export interface LoopAgentWorkspaceProps {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  triage: SupportTriageResult;
}

interface AssistantTraceProps {
  isLastMessage: boolean;
  isStreaming: boolean;
  message: UIMessage;
  triage: SupportTriageResult;
}

function AssistantTrace({
  isLastMessage,
  isStreaming,
  message,
  triage,
}: AssistantTraceProps) {
  const text = getTextContent(message);
  const reasoningText = getReasoningText(message);
  const toolParts = getToolParts(message);
  const hasReasoning = reasoningText.length > 0;
  const hasText = text.length > 0;
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming =
    isLastMessage && isStreaming && lastPart?.type === "reasoning";
  const showBodyThinking =
    isLastMessage && isStreaming && !hasReasoning && !hasText;
  let bodyContent: ReactNode = null;

  if (hasText) {
    bodyContent = <MessageResponse>{text}</MessageResponse>;
  } else if (showBodyThinking) {
    bodyContent = <Shimmer className="text-sm">Thinking...</Shimmer>;
  }

  return (
    <>
      {hasReasoning ? (
        <Reasoning className="w-full" isStreaming={isReasoningStreaming}>
          <ReasoningTrigger />
          <ReasoningContent>{reasoningText}</ReasoningContent>
        </Reasoning>
      ) : null}

      {toolParts.length > 0 ? (
        <ChainOfThought
          className="rounded-md border border-foreground/10 bg-muted/20 px-3 py-3"
          defaultOpen
        >
          <ChainOfThoughtHeader>Verification steps</ChainOfThoughtHeader>
          <ChainOfThoughtContent>
            {triage.toolBatches.map((batch) => (
              <ChainOfThoughtStep
                description={getBatchDescription(batch, triage)}
                key={batch.label}
                label={batch.label}
                status={getBatchStatus(batch.tools, toolParts)}
              >
                <ChainOfThoughtSearchResults>
                  {batch.tools.map((toolName) => (
                    <ChainOfThoughtSearchResult key={toolName}>
                      {toolName}
                    </ChainOfThoughtSearchResult>
                  ))}
                </ChainOfThoughtSearchResults>
              </ChainOfThoughtStep>
            ))}

            <ChainOfThoughtStep
              description={`${triage.recommendation.priority} priority ${triage.recommendation.action} for ${triage.caseId}.`}
              label="Prepare recommendation"
              status={text ? "complete" : "active"}
            />
          </ChainOfThoughtContent>
        </ChainOfThought>
      ) : null}

      {bodyContent}

      {toolParts.map((part) => (
        <Tool key={part.toolCallId}>
          {part.type === "dynamic-tool" ? (
            <ToolHeader
              state={part.state}
              title="Support Triage Tool"
              toolName={part.toolName}
              type={part.type}
            />
          ) : (
            <ToolHeader
              state={part.state}
              title="Support Triage Tool"
              type={part.type}
            />
          )}
          <ToolContent>
            {part.input ? <ToolInput input={part.input} /> : null}
            <ToolOutput errorText={part.errorText} output={part.output} />
          </ToolContent>
        </Tool>
      ))}
    </>
  );
}

export function LoopAgentWorkspace({
  chatModel,
  isChatAvailable,
  nodeVersion,
  setupMessage,
  triage,
}: LoopAgentWorkspaceProps) {
  const [chat] = useState(
    () =>
      new Chat({
        transport: new DefaultChatTransport({
          api: "/api/demos/loop-agent",
        }),
      })
  );
  const { error, messages, regenerate, sendMessage, status, stop } = useChat({
    chat,
  });
  const hasMessages = messages.length > 0;
  const isBusy = status === "submitted" || status === "streaming";
  const samplePrompts = useMemo(
    () => [
      `Triage ${triage.caseId} and explain the tool sequence.`,
      "Which lookups can run in parallel before the SLA decision?",
      "What should the support team do next?",
    ],
    [triage.caseId]
  );

  return (
    <div className="grid min-h-[70svh] gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="flex min-h-[70svh] flex-col border border-foreground/10 bg-background">
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

        <Conversation>
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
            {hasMessages ? (
              messages.map((message, index) => (
                <Message from={message.role} key={message.id}>
                  <MessageContent
                    className={cn(
                      "space-y-4",
                      message.role === "assistant" ? "max-w-3xl" : "max-w-2xl"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <AssistantTrace
                        isLastMessage={index === messages.length - 1}
                        isStreaming={isBusy}
                        message={message}
                        triage={triage}
                      />
                    ) : (
                      <MessageResponse>
                        {getTextContent(message)}
                      </MessageResponse>
                    )}
                  </MessageContent>
                </Message>
              ))
            ) : (
              <ConversationEmptyState
                description="Ask the agent to triage the default support case and inspect which tools run before the final recommendation."
                icon={<GitBranchIcon className="size-5" />}
                title="Support triage loop is ready"
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-foreground/10 border-t px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput onSubmit={({ text }) => sendMessage({ text })}>
              <PromptInputBody>
                <PromptInputTextarea
                  disabled={!isChatAvailable || isBusy}
                  placeholder="Ask the agent to triage the default support case."
                />
              </PromptInputBody>
              <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">ToolLoopAgent</Badge>
                  <Badge variant="outline">Tools</Badge>
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
                      onClick={() => regenerate()}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <ArrowClockwiseIcon className="size-3.5" />
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
                {samplePrompts.map((prompt) => (
                  <Button
                    key={prompt}
                    onClick={() => sendMessage({ text: prompt })}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <WrenchIcon className="size-3.5" />
                    {prompt}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <aside className="border border-foreground/10 bg-background p-4">
        <div className="space-y-5">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Runtime
            </p>
            <p className="mt-1 font-medium text-sm">{nodeVersion}</p>
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Active case
            </p>
            <p className="mt-1 font-medium text-sm">{triage.caseId}</p>
            <p className="mt-1 text-muted-foreground text-sm">
              {triage.ticket.title}
            </p>
          </div>

          <div className="grid gap-2">
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Tool plan
            </p>
            {triage.toolBatches.map((batch) => (
              <div
                className="border border-foreground/10 p-3"
                key={batch.label}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-sm">{batch.label}</p>
                  <Badge variant="outline">{batch.execution}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {batch.tools.map((toolName) => (
                    <Badge key={toolName} variant="secondary">
                      {toolName}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Recommendation
            </p>
            <p className="mt-1 font-medium text-sm">
              {triage.recommendation.action} / {triage.recommendation.priority}
            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              {triage.risk.reason}
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
