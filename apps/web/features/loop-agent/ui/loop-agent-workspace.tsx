"use client";

import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  GitBranchIcon,
  StopIcon,
  WrenchIcon,
  XCircleIcon,
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
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@workspace/ui/components/ai-elements/confirmation";
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
  type ChatAddToolApproveResponseFunction,
  isReasoningUIPart,
  isToolUIPart,
  type UIMessage,
} from "ai";
import { type ReactNode, useMemo } from "react";

import type { SupportTriageResult } from "@/features/loop-agent/server/support-triage";
import {
  ConversationErrorMessage,
  useConversationErrorRetry,
} from "@/features/shared/chat/ui/conversation-error-message";
import { useLoopAgentChat } from "./use-loop-agent-chat";

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
    (part) =>
      part.state === "output-available" || part.state === "output-denied"
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
  if (batch.tools.includes("requestHumanApproval")) {
    return `Requests human approval before escalating ${triage.caseId}.`;
  }

  if (batch.execution === "parallel") {
    return `Checks account context in parallel before the SLA decision for ${triage.caseId}.`;
  }

  return `Uses the completed account context to assess SLA risk for ${triage.caseId}.`;
}

interface ApprovalToolInput {
  action?: string;
  caseId?: string;
  customerName?: string;
  customerUpdate?: string;
  internalHandoff?: string;
  priority?: string;
  rationale?: string[];
}

function getApprovalToolInput(part: ToolPart): ApprovalToolInput {
  if (
    typeof part.input !== "object" ||
    part.input === null ||
    Array.isArray(part.input)
  ) {
    return {};
  }

  return part.input as ApprovalToolInput;
}

interface HumanApprovalConfirmationProps {
  onApprovalResponse: ChatAddToolApproveResponseFunction;
  part: ToolPart;
  triage: SupportTriageResult;
}

function HumanApprovalConfirmation({
  onApprovalResponse,
  part,
  triage,
}: HumanApprovalConfirmationProps) {
  const approval = part.approval;

  if (!approval) {
    return null;
  }

  const input = getApprovalToolInput(part);
  const target = input.customerName
    ? `${input.customerName} / ${input.caseId ?? triage.caseId}`
    : (input.caseId ?? triage.caseId);
  const action = input.action ?? triage.recommendation.action;
  const priority = input.priority ?? triage.recommendation.priority;

  return (
    <Confirmation
      approval={approval}
      className="border-amber-500/30 bg-amber-500/5"
      state={part.state}
    >
      <ConfirmationTitle>Human approval checkpoint</ConfirmationTitle>
      <ConfirmationRequest>
        <div className="space-y-2 text-sm">
          <p>
            Approve {priority} priority {action} for {target}?
          </p>
          {input.customerUpdate ? (
            <p className="text-muted-foreground">{input.customerUpdate}</p>
          ) : null}
          {input.rationale?.length ? (
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              {input.rationale.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </ConfirmationRequest>
      <ConfirmationAccepted>
        <CheckCircleIcon className="size-4" />
        <span>Approved. The agent can execute the escalation handoff.</span>
      </ConfirmationAccepted>
      <ConfirmationRejected>
        <XCircleIcon className="size-4" />
        <span>Rejected. The agent will continue without escalating.</span>
      </ConfirmationRejected>
      <ConfirmationActions>
        <ConfirmationAction
          onClick={() =>
            onApprovalResponse({
              approved: false,
              id: approval.id,
              reason: "Reviewer rejected the support escalation.",
            })
          }
          variant="outline"
        >
          <XCircleIcon className="size-3.5" />
          Reject
        </ConfirmationAction>
        <ConfirmationAction
          onClick={() =>
            onApprovalResponse({
              approved: true,
              id: approval.id,
              reason: "Reviewer approved the support escalation.",
            })
          }
        >
          <CheckCircleIcon className="size-3.5" />
          Approve
        </ConfirmationAction>
      </ConfirmationActions>
    </Confirmation>
  );
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
  onApprovalResponse: ChatAddToolApproveResponseFunction;
  triage: SupportTriageResult;
}

function AssistantTrace({
  isLastMessage,
  isStreaming,
  message,
  onApprovalResponse,
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

      {toolParts.map((part) => (
        <div className="space-y-3" key={part.toolCallId}>
          <HumanApprovalConfirmation
            onApprovalResponse={onApprovalResponse}
            part={part}
            triage={triage}
          />
          <Tool>
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
        </div>
      ))}

      {bodyContent}
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
  const {
    addToolApprovalResponse,
    clearError,
    error,
    hasMessages,
    isBusy,
    messages,
    regenerate,
    sendMessage,
    status,
    stop,
  } = useLoopAgentChat();
  const retryConversationError = useConversationErrorRetry({
    clearError,
    regenerate,
  });
  const samplePrompts = useMemo(
    () => [
      `Triage ${triage.caseId} and explain the tool sequence.`,
      `Triage ${triage.caseId} and show which lookups ran in parallel before the SLA decision.`,
      `Triage ${triage.caseId}, request human approval before escalation, then finalize.`,
    ],
    [triage.caseId]
  );

  return (
    <div className="grid min-h-[70svh] gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="flex min-h-[70svh] flex-col border border-foreground/10 bg-background lg:h-full lg:min-h-0">
        {isChatAvailable ? null : (
          <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
            {setupMessage}
          </div>
        )}

        <Conversation className="min-h-0">
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
            {hasMessages || error ? (
              <>
                {messages.map((message, index) => (
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
                          onApprovalResponse={addToolApprovalResponse}
                          triage={triage}
                        />
                      ) : (
                        <MessageResponse>
                          {getTextContent(message)}
                        </MessageResponse>
                      )}
                    </MessageContent>
                  </Message>
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
                  <Badge variant="outline">Human approval</Badge>
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

      <aside className="border border-foreground/10 bg-background p-4 lg:min-h-0 lg:overflow-y-auto">
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
