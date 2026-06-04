"use client";

import { Chat } from "@ai-sdk/react";
import {
  ArrowClockwiseIcon,
  CaretDownIcon,
  CheckCircleIcon,
  RobotIcon,
  StopIcon,
  XCircleIcon,
} from "@phosphor-icons/react";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  Confirmation,
  ConfirmationAccepted,
  ConfirmationAction,
  ConfirmationActions,
  ConfirmationRejected,
  ConfirmationRequest,
  ConfirmationTitle,
} from "@/components/ai-elements/confirmation";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolPart,
} from "@/components/ai-elements/tool";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  type ChatAddToolApproveResponseFunction,
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { type ReactNode, useEffect, useState } from "react";

import { useDemoChat } from "@/components/demo-chat/use-demo-chat";
import type { OpenAiAgentsSdkDemoMessage } from "@/lib/openai-agents-sdk-demo/message-metadata";
import type { OpenAiAgentsSdkDemoContextProfile } from "@/lib/openai-agents-sdk-demo/server/context";
import type { OpenAiAgentsSdkDemoAiSdkExtensionProfile } from "@/lib/openai-agents-sdk-demo/server/extensions";
import type { OpenAiAgentsSdkDemoGuardrailCatalogEntry } from "@/lib/openai-agents-sdk-demo/server/guardrails";
import type { OpenAiAgentsSdkDemoGuideCoverage } from "@/lib/openai-agents-sdk-demo/server/guide-coverage";
import type { OpenAiAgentsSdkDemoHandoffCatalogEntry } from "@/lib/openai-agents-sdk-demo/server/handoffs";
import type {
  OpenAiAgentsSdkDemoMcpCatalogEntry,
  OpenAiAgentsSdkDemoMcpProfile,
} from "@/lib/openai-agents-sdk-demo/server/mcp";
import type { OpenAiAgentsSdkDemoModelProfile } from "@/lib/openai-agents-sdk-demo/server/models";
import type { OpenAiAgentsSdkDemoRunProfile } from "@/lib/openai-agents-sdk-demo/server/running";
import type { OpenAiAgentsSdkDemoSandboxProfile } from "@/lib/openai-agents-sdk-demo/server/sandbox";
import type { OpenAiAgentsSdkDemoSessionProfile } from "@/lib/openai-agents-sdk-demo/server/sessions";
import type { OpenAiAgentsSdkDemoToolCatalogEntry } from "@/lib/openai-agents-sdk-demo/server/tools";
import type { OpenAiAgentsSdkDemoTraceProfile } from "@/lib/openai-agents-sdk-demo/server/tracing";
import type { OpenAiAgentsSdkDemoVoiceProfile } from "@/lib/openai-agents-sdk-demo/server/voice";
import { buildOpenAiAgentsSdkDemoRuntimeInspector } from "./openai-agents-sdk-demo-runtime-inspector";
import {
  getOpenAiAgentsSdkDemoApprovalInputFields,
  getOpenAiAgentsSdkDemoFailedTurnRetryText,
  getOpenAiAgentsSdkDemoFileParts,
  getOpenAiAgentsSdkDemoMessageText,
  getOpenAiAgentsSdkDemoRecoverableMessages,
  getOpenAiAgentsSdkDemoRenderableReasoningText,
  getOpenAiAgentsSdkDemoSourceParts,
  getOpenAiAgentsSdkDemoToolDisplayState,
  getOpenAiAgentsSdkDemoToolName,
  getOpenAiAgentsSdkDemoToolParts,
  shouldRenderOpenAiAgentsSdkDemoReasoning,
} from "./openai-agents-sdk-demo-session";
import { OpenAiAgentsSdkDemoVoicePanel } from "./openai-agents-sdk-demo-voice-panel";
import { openAiAgentsSdkDemoWorkspaceLayout } from "./openai-agents-sdk-demo-workspace-layout";

const openAiAgentsSdkDemoSamplePrompts = [
  "Explain how this demo bridges the OpenAI Agents SDK run into AI SDK UI messages.",
  "Run a short planning answer that uses the configured guide coverage and model profile.",
  "Summarize what the demo proves about tools, handoffs, and tracing in one response.",
] as const;

function ThinkingState() {
  return <Shimmer className="text-sm">Thinking...</Shimmer>;
}

function getApprovalInputPreview(part: ToolPart) {
  if (typeof part.input === "string") {
    return part.input;
  }

  try {
    return JSON.stringify(part.input, null, 2);
  } catch {
    return String(part.input);
  }
}

interface OpenAiAgentsSdkDemoChatError {
  id: string;
  message: string;
  retryText: string | null;
}

function OpenAiAgentsSdkDemoToolApproval({
  onApprovalResponse,
  part,
}: {
  onApprovalResponse: ChatAddToolApproveResponseFunction;
  part: ToolPart;
}) {
  if (!("approval" in part && part.approval)) {
    return null;
  }

  const approval = part.approval;
  const fields = getOpenAiAgentsSdkDemoApprovalInputFields(part);
  const preview = getApprovalInputPreview(part);

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
            Approve {getOpenAiAgentsSdkDemoToolName(part)} before the agent
            continues?
          </p>
          {fields.length > 0 ? (
            <div className="grid gap-2">
              {fields.map((field) => (
                <div
                  className="grid gap-1 rounded border border-foreground/10 px-3 py-2 sm:grid-cols-[7rem_minmax(0,1fr)]"
                  key={field.label}
                >
                  <span className="text-muted-foreground text-xs uppercase tracking-[0.16em]">
                    {field.label}
                  </span>
                  <span className="min-w-0 whitespace-pre-wrap break-words">
                    {field.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <pre className="overflow-x-auto whitespace-pre-wrap break-words text-muted-foreground text-xs">
              {preview}
            </pre>
          )}
        </div>
      </ConfirmationRequest>
      <ConfirmationAccepted>
        <CheckCircleIcon className="size-4" />
        <span>Approved. The agent can continue this run.</span>
      </ConfirmationAccepted>
      <ConfirmationRejected>
        <XCircleIcon className="size-4" />
        <span>Rejected. The agent will continue with the denial result.</span>
      </ConfirmationRejected>
      <ConfirmationActions>
        <ConfirmationAction
          onClick={() =>
            onApprovalResponse({
              approved: false,
              id: approval.id,
              reason: "Reviewer rejected the approval request.",
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
              reason: "Reviewer approved the request.",
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

function OpenAiAgentsSdkDemoToolTrace({
  isMessageStreaming,
  part,
}: {
  isMessageStreaming: boolean;
  part: ToolPart;
}) {
  const toolName = getOpenAiAgentsSdkDemoToolName(part);
  const displayState = getOpenAiAgentsSdkDemoToolDisplayState(part, {
    isMessageStreaming,
  });
  const hasRenderableOutput = Boolean(part.output || part.errorText);
  const isSettledInputOnly =
    displayState === "output-available" &&
    (part.state === "input-available" || part.state === "input-streaming") &&
    !hasRenderableOutput;

  return (
    <Tool>
      {part.type === "dynamic-tool" ? (
        <ToolHeader
          state={displayState}
          title={toolName}
          toolName={toolName}
          type={part.type}
        />
      ) : (
        <ToolHeader state={displayState} title={toolName} type={part.type} />
      )}
      <ToolContent>
        {part.input ? <ToolInput input={part.input} /> : null}
        {isSettledInputOnly ? (
          <p className="text-muted-foreground text-sm">
            Hosted tool completed without a renderable output payload.
          </p>
        ) : null}
        <ToolOutput errorText={part.errorText} output={part.output} />
      </ToolContent>
    </Tool>
  );
}

function OpenAiAgentsSdkDemoSources({
  sources,
}: {
  sources: ReturnType<typeof getOpenAiAgentsSdkDemoSourceParts>;
}) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <Sources>
      <SourcesTrigger count={sources.length} />
      <SourcesContent>
        {sources.map((source) => (
          <Source
            href={source.url}
            key={source.sourceId}
            title={source.title}
          />
        ))}
      </SourcesContent>
    </Sources>
  );
}

function OpenAiAgentsSdkDemoErrorMessage({
  error,
  onRetry,
}: {
  error: OpenAiAgentsSdkDemoChatError;
  onRetry: (text: string) => void;
}) {
  return (
    <Message from="assistant" key={error.id}>
      <MessageContent className="max-w-3xl">
        <div
          className="space-y-3 border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
          role="alert"
        >
          <div className="flex items-start gap-2 text-destructive">
            <XCircleIcon className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 space-y-1">
              <p className="font-medium">Agent turn failed</p>
              <p className="whitespace-pre-wrap break-words text-destructive/90">
                {error.message}
              </p>
            </div>
          </div>
          {error.retryText ? (
            <Button
              onClick={() => onRetry(error.retryText ?? "")}
              size="sm"
              type="button"
              variant="outline"
            >
              <ArrowClockwiseIcon className="size-3.5" />
              Retry
            </Button>
          ) : null}
        </div>
      </MessageContent>
    </Message>
  );
}

function getImplementationLabel(
  status: OpenAiAgentsSdkDemoGuideCoverage["implementationStatus"]
) {
  if (status === "implemented") {
    return "Implemented";
  }

  if (status === "blocked") {
    return "Blocked";
  }

  return "Not started";
}

function getRunStatusLabel(
  status: OpenAiAgentsSdkDemoGuideCoverage["currentRunStatus"]
) {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "used-this-run") {
    return "Used this run";
  }

  if (status === "blocked") {
    return "Blocked";
  }

  return "Not started";
}

function getStatusClassName(
  status:
    | OpenAiAgentsSdkDemoGuideCoverage["currentRunStatus"]
    | OpenAiAgentsSdkDemoGuideCoverage["implementationStatus"]
) {
  if (
    status === "implemented" ||
    status === "ready" ||
    status === "used-this-run"
  ) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (status === "blocked") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  return "border-foreground/10 bg-muted/40 text-muted-foreground";
}

export interface OpenAiAgentsSdkDemoWorkspaceProps {
  aiSdkExtensionProfile: OpenAiAgentsSdkDemoAiSdkExtensionProfile;
  chatModel: string;
  contextProfile: OpenAiAgentsSdkDemoContextProfile;
  guardrailCatalog: OpenAiAgentsSdkDemoGuardrailCatalogEntry[];
  guideCoverage: OpenAiAgentsSdkDemoGuideCoverage[];
  handoffCatalog: OpenAiAgentsSdkDemoHandoffCatalogEntry[];
  isChatAvailable: boolean;
  mcpCatalog: OpenAiAgentsSdkDemoMcpCatalogEntry[];
  mcpProfile: OpenAiAgentsSdkDemoMcpProfile;
  modelProfile: OpenAiAgentsSdkDemoModelProfile;
  nodeVersion: string;
  runProfile: OpenAiAgentsSdkDemoRunProfile;
  sandboxProfile: OpenAiAgentsSdkDemoSandboxProfile;
  sessionProfile: OpenAiAgentsSdkDemoSessionProfile;
  setupMessage: string | null;
  toolCatalog: OpenAiAgentsSdkDemoToolCatalogEntry[];
  traceProfile: OpenAiAgentsSdkDemoTraceProfile;
  voiceProfile: OpenAiAgentsSdkDemoVoiceProfile;
}

function getToolAvailabilityClassName(
  availability: OpenAiAgentsSdkDemoToolCatalogEntry["availability"]
) {
  if (availability === "configured") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (availability === "provider-blocked") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }

  return "border-foreground/10 bg-muted/40 text-muted-foreground";
}

function InspectorBadge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        "h-auto min-w-0 max-w-full shrink items-start overflow-hidden whitespace-normal break-all px-2 py-1 text-left text-[11px] leading-tight",
        className
      )}
      variant="outline"
    >
      {children}
    </Badge>
  );
}

function InspectorRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 max-w-[9rem] break-all text-right text-foreground text-xs leading-5">
        {value}
      </span>
    </div>
  );
}

function InspectorCollapsible({
  children,
  defaultOpen = false,
  summary,
  title,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  summary: string;
  title: string;
}) {
  return (
    <Collapsible
      className="border border-foreground/10"
      defaultOpen={defaultOpen}
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left">
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm">{title}</p>
          <p className="text-muted-foreground text-xs leading-5">{summary}</p>
        </div>
        <CaretDownIcon className="size-4 shrink-0 text-muted-foreground" />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-3 border-foreground/10 border-t px-3 py-3 text-sm">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function OpenAiAgentsSdkDemoWorkspace({
  aiSdkExtensionProfile,
  chatModel,
  contextProfile,
  guardrailCatalog,
  guideCoverage,
  handoffCatalog,
  isChatAvailable,
  mcpCatalog,
  mcpProfile,
  modelProfile,
  nodeVersion,
  runProfile,
  sandboxProfile,
  sessionProfile,
  setupMessage,
  traceProfile,
  toolCatalog,
  voiceProfile,
}: OpenAiAgentsSdkDemoWorkspaceProps) {
  const {
    addToolApprovalResponse,
    clearError,
    error,
    hasMessages,
    isBusy,
    messages,
    regenerate,
    sendMessage,
    setMessages,
    status,
    stop,
  } = useDemoChat<OpenAiAgentsSdkDemoMessage>({
    createChat: () =>
      new Chat({
        sendAutomaticallyWhen:
          lastAssistantMessageIsCompleteWithApprovalResponses,
        transport: new DefaultChatTransport({
          api: "/api/demos/openai-agents-sdk-demo",
        }),
      }),
  });
  const [hasUsedVoiceGuide, setHasUsedVoiceGuide] = useState(false);
  const [chatErrorMessage, setChatErrorMessage] =
    useState<OpenAiAgentsSdkDemoChatError | null>(null);
  const runtimeInspector = buildOpenAiAgentsSdkDemoRuntimeInspector({
    aiSdkExtensionProfile,
    guideCoverage,
    hasUsedVoiceGuide,
    messages,
    traceProfile,
  });
  const {
    aiSdkModelAdapterStatus,
    aiSdkUiBridgeStatus,
    guideCoverageWithCurrentRun,
    hasPendingApproval,
    lastApprovalSummary,
    lastContextSummary,
    lastHandoffSummary,
    lastMcpSummary,
    lastResponseId,
    lastResultSummary,
    lastSandboxSummary,
    lastSessionSummary,
    lastStreamSummary,
    lastTraceSummary,
    traceIncludesSensitiveData,
    usedGuardrailNames,
    usedToolNames,
  } = runtimeInspector;

  useEffect(() => {
    if (!error) {
      return;
    }

    setChatErrorMessage({
      id: `openai-agents-sdk-demo-error-${Date.now()}`,
      message: error.message,
      retryText: getOpenAiAgentsSdkDemoFailedTurnRetryText(messages),
    });
    setMessages(getOpenAiAgentsSdkDemoRecoverableMessages(messages));
    clearError();
  }, [clearError, error, messages, setMessages]);

  function handleSendMessage(text: string) {
    const trimmedText = text.trim();

    if (trimmedText.length === 0) {
      return;
    }

    clearError();
    setChatErrorMessage(null);
    sendMessage({ text: trimmedText });
  }

  function handleRetryFailedTurn(text: string) {
    const trimmedText = text.trim();

    if (trimmedText.length === 0) {
      return;
    }

    clearError();
    setChatErrorMessage(null);
    sendMessage({ text: trimmedText });
  }

  return (
    <div
      className={cn(
        "grid grid-rows-[minmax(0,1fr)_minmax(0,26rem)] gap-4 overflow-hidden md:grid-cols-[minmax(0,1fr)_20rem] md:grid-rows-1",
        openAiAgentsSdkDemoWorkspaceLayout.workspaceHeightClassName
      )}
    >
      <section className="flex min-h-0 flex-col overflow-hidden border border-foreground/10 bg-background">
        {isChatAvailable ? null : (
          <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
            {setupMessage}
          </div>
        )}

        <Conversation className="min-h-0">
          <ConversationContent className="mx-auto flex w-full max-w-3xl flex-1 gap-6 px-4 py-6">
            {hasMessages ? (
              messages.map((message, index) => {
                const text = getOpenAiAgentsSdkDemoMessageText(message).trim();
                const nextMessage = messages[index + 1];
                const reasoningText = shouldRenderOpenAiAgentsSdkDemoReasoning(
                  message,
                  nextMessage
                )
                  ? getOpenAiAgentsSdkDemoRenderableReasoningText(
                      message
                    ).trim()
                  : "";
                const sourceParts = getOpenAiAgentsSdkDemoSourceParts(message);
                const fileParts = getOpenAiAgentsSdkDemoFileParts(message);
                const toolParts = getOpenAiAgentsSdkDemoToolParts(message);
                const isLastMessage = index === messages.length - 1;
                const isMessageStreaming =
                  message.role === "assistant" && isBusy && isLastMessage;
                const lastPart = message.parts.at(-1);
                const isReasoningStreaming =
                  isMessageStreaming && lastPart?.type === "reasoning";
                const hasVisibleContent =
                  text.length > 0 ||
                  reasoningText.length > 0 ||
                  sourceParts.length > 0 ||
                  fileParts.length > 0 ||
                  toolParts.length > 0;
                const showThinking =
                  message.role === "assistant" &&
                  isMessageStreaming &&
                  !hasVisibleContent;

                return (
                  <Message from={message.role} key={message.id}>
                    <MessageContent
                      className={cn(
                        "space-y-4",
                        message.role === "assistant" ? "max-w-3xl" : "max-w-2xl"
                      )}
                    >
                      {reasoningText ? (
                        <Reasoning
                          className="w-full"
                          isStreaming={isReasoningStreaming}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{reasoningText}</ReasoningContent>
                        </Reasoning>
                      ) : null}

                      {toolParts.map((part) =>
                        part.state === "approval-requested" ||
                        part.state === "approval-responded" ? (
                          <OpenAiAgentsSdkDemoToolApproval
                            key={part.toolCallId}
                            onApprovalResponse={addToolApprovalResponse}
                            part={part}
                          />
                        ) : (
                          <OpenAiAgentsSdkDemoToolTrace
                            isMessageStreaming={isMessageStreaming}
                            key={part.toolCallId}
                            part={part}
                          />
                        )
                      )}

                      {text ? <MessageResponse>{text}</MessageResponse> : null}

                      <OpenAiAgentsSdkDemoSources sources={sourceParts} />

                      {fileParts.length > 0 ? (
                        <Attachments variant="list">
                          {fileParts.map((part) => {
                            const attachmentId = `${message.id}-${part.filename ?? "attachment"}-${part.url}`;

                            return (
                              <Attachment
                                data={{
                                  ...part,
                                  id: attachmentId,
                                }}
                                key={attachmentId}
                              >
                                <AttachmentPreview />
                                <AttachmentInfo showMediaType />
                              </Attachment>
                            );
                          })}
                        </Attachments>
                      ) : null}

                      {showThinking ? <ThinkingState /> : null}
                      {hasVisibleContent ||
                      (message.role === "assistant" &&
                        isMessageStreaming) ? null : (
                        <p className="text-muted-foreground text-sm/relaxed">
                          No visible assistant output was returned for this
                          turn.
                        </p>
                      )}
                    </MessageContent>
                  </Message>
                );
              })
            ) : (
              <ConversationEmptyState
                description="Send a prompt and exercise the official OpenAI Agents SDK to AI SDK UI bridge without leaving the current frontend stack."
                icon={<RobotIcon className="size-5" />}
                title="OpenAI Agents workspace is ready"
              />
            )}
            {chatErrorMessage ? (
              <OpenAiAgentsSdkDemoErrorMessage
                error={chatErrorMessage}
                onRetry={handleRetryFailedTurn}
              />
            ) : null}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-foreground/10 border-t px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput onSubmit={({ text }) => handleSendMessage(text)}>
              <PromptInputBody>
                <PromptInputTextarea
                  disabled={!isChatAvailable || isBusy || hasPendingApproval}
                  placeholder={
                    hasPendingApproval
                      ? "Approve or reject the pending tool request to continue this run."
                      : "Ask for a plan, a short explanation, or a demo-specific agent answer."
                  }
                />
              </PromptInputBody>
              <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">OpenAI Agents SDK</Badge>
                  <Badge variant="outline">AI SDK UI bridge</Badge>
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
                    disabled={!isChatAvailable || hasPendingApproval}
                    status={status}
                  />
                </div>
              </PromptInputFooter>
            </PromptInput>

            {hasMessages ? null : (
              <div className="mt-3 flex flex-wrap gap-2">
                {openAiAgentsSdkDemoSamplePrompts.map((prompt) => (
                  <Button
                    disabled={!isChatAvailable || hasPendingApproval || isBusy}
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <RobotIcon className="size-3.5" />
                    {prompt}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <aside className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden border border-foreground/10 bg-background">
        <OpenAiAgentsSdkDemoVoicePanel
          onUsageChange={setHasUsedVoiceGuide}
          voiceProfile={voiceProfile}
        />

        <div className="min-w-0 space-y-5 overflow-y-auto overflow-x-hidden p-4">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Runtime
            </p>
            <p className="mt-1 font-medium text-sm">{nodeVersion}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Contract
            </p>
            <p className="mt-1 text-sm">
              This slot keeps the agent backend on the official OpenAI run path
              and lets the existing AI SDK UI frontend consume the result
              without a custom stream protocol.
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Running
            </p>
            <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Workflow</span>
                <span>{runProfile.workflowName}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Continuation</span>
                <span>{runProfile.continuationStrategy}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Max turns</span>
                <span>{runProfile.maxTurns}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Abort</span>
                <span>
                  {runProfile.usesRequestSignal ? "request.signal" : "none"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Last response</span>
                <span className="max-w-[10rem] truncate text-right">
                  {lastResponseId ?? "Not available yet"}
                </span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Context
            </p>
            <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Primitive</span>
                <span>{contextProfile.localContextPrimitive}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Session binding</span>
                <span>{contextProfile.sessionBinding}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Run mode</span>
                <span>{lastContextSummary?.researchMode ?? "No run yet"}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Default target</span>
                <span>{contextProfile.suggestedDefaultTarget}</span>
              </div>
              <div className="space-y-2 pt-1">
                <div>
                  <p className="text-muted-foreground text-xs">Channels</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {contextProfile.passesContextInto.map((value) => (
                      <Badge key={value} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Latest user prompt
                  </p>
                  <p className="mt-1 text-xs/relaxed">
                    {lastContextSummary?.latestUserPromptPreview ||
                      "No context metadata yet"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Sessions
            </p>
            <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Primitive</span>
                <span>{sessionProfile.sdkPrimitive}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Storage</span>
                <span>{sessionProfile.historyStorage}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Transport</span>
                <span className="max-w-[10rem] text-right">
                  {sessionProfile.sessionTransport}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Session id</span>
                <span className="max-w-[10rem] truncate text-right">
                  {lastSessionSummary?.sessionId ?? "Not created yet"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">History items</span>
                <span>{lastSessionSummary?.historyItemCount ?? 0}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">CRUD helpers</span>
                <span>
                  {sessionProfile.supportsCrudHelpers
                    ? "get/add/pop/clear"
                    : "none"}
                </span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Streaming
            </p>
            <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
              <InspectorRow
                label="Bridge"
                value="createAiSdkUiMessageStream()"
              />
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Raw model events</span>
                <span>{lastStreamSummary?.rawModelEventCount ?? 0}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Run item events</span>
                <span>{lastStreamSummary?.runItemEventCount ?? 0}</span>
              </div>
              <div className="space-y-2 pt-1">
                <div>
                  <p className="text-muted-foreground text-xs">Agents</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(lastStreamSummary?.agentNames.length
                      ? lastStreamSummary.agentNames
                      : ["No stream metadata yet"]
                    ).map((value) => (
                      <Badge key={value} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Raw event types
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(lastStreamSummary?.rawModelEventTypes.length
                      ? lastStreamSummary.rawModelEventTypes
                      : ["No stream metadata yet"]
                    ).map((value) => (
                      <Badge key={value} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Run item names
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(lastStreamSummary?.runItemEventNames.length
                      ? lastStreamSummary.runItemEventNames
                      : ["No stream metadata yet"]
                    ).map((value) => (
                      <Badge key={value} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Sources</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(lastStreamSummary?.rawModelSources.length
                      ? lastStreamSummary.rawModelSources
                      : ["No stream metadata yet"]
                    ).map((value) => (
                      <Badge key={value} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              AI SDK Extension
            </p>
            <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
              <InspectorRow
                label="UI bridge"
                value={aiSdkExtensionProfile.uiBridge.sdkPrimitive}
              />
              <InspectorRow
                label="Response helper"
                value={aiSdkExtensionProfile.uiBridge.responseHelper}
              />
              <InspectorRow
                label="Bridge status"
                value={<InspectorBadge>{aiSdkUiBridgeStatus}</InspectorBadge>}
              />
              <InspectorRow
                label="Model adapter"
                value={aiSdkExtensionProfile.modelAdapter.sdkPrimitive}
              />
              <InspectorRow
                label="Adapter status"
                value={
                  <InspectorBadge>{aiSdkModelAdapterStatus}</InspectorBadge>
                }
              />
              <p className="pt-1 text-muted-foreground text-xs/relaxed">
                {aiSdkExtensionProfile.modelAdapter.notes}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Voice Agents
            </p>
            <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
              <div className="flex flex-wrap gap-1.5">
                <InspectorBadge>{voiceProfile.agentPrimitive}</InspectorBadge>
                <InspectorBadge>{voiceProfile.sessionPrimitive}</InspectorBadge>
                <InspectorBadge>
                  {voiceProfile.browserTransport.transport}
                </InspectorBadge>
                <InspectorBadge className="capitalize">
                  {voiceProfile.browserTransport.status}
                </InspectorBadge>
              </div>

              <div className="space-y-2">
                <InspectorRow
                  label="Browser model"
                  value={voiceProfile.browserTransport.sessionModel}
                />
                <InspectorRow
                  label="Voice"
                  value={voiceProfile.browserTransport.sessionVoice}
                />
                <InspectorRow
                  label="Tools"
                  value={`${voiceProfile.lane.toolNames.length} total / ${voiceProfile.lane.approvalToolNames.length} gated`}
                />
                <InspectorRow
                  label="Handoffs"
                  value={String(voiceProfile.lane.handoffAgentNames.length)}
                />
                <InspectorRow
                  label="Provider lanes"
                  value={String(voiceProfile.providerExtensions.length)}
                />
                <InspectorRow
                  label="Workspace"
                  value={
                    voiceProfile.supportedInsideCurrentWorkspace
                      ? "supported"
                      : "blocked"
                  }
                />
              </div>

              <InspectorCollapsible
                defaultOpen={false}
                summary="Route, key contract, events, and browser-only hooks."
                title="Browser lane"
              >
                <InspectorRow
                  label="Route"
                  value={voiceProfile.browserTransport.routePath}
                />
                <InspectorRow
                  label="Credential"
                  value={voiceProfile.browserTransport.credentialContract}
                />
                <InspectorRow
                  label="Workspace support"
                  value={
                    voiceProfile.supportedInsideCurrentWorkspace
                      ? "supported"
                      : "blocked"
                  }
                />
                <InspectorRow
                  label="Chat route"
                  value={
                    voiceProfile.supportedInsideCurrentChatRoute
                      ? "supported"
                      : "blocked"
                  }
                />
                <div>
                  <p className="text-muted-foreground text-xs">
                    Session events
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {voiceProfile.lane.emittedSessionEvents.map((value) => (
                      <InspectorBadge key={value}>{value}</InspectorBadge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Transport hook
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <InspectorBadge>
                      {voiceProfile.lane.transportEscapeHatch}
                    </InspectorBadge>
                  </div>
                </div>
              </InspectorCollapsible>

              <InspectorCollapsible
                defaultOpen={false}
                summary="Server WebSocket, raw audio loop, and SIP runtime contracts."
                title="Server lanes"
              >
                <InspectorRow
                  label="Server transport"
                  value={voiceProfile.serverTransport.transport}
                />
                <InspectorRow
                  label="Server model"
                  value={voiceProfile.serverTransport.model}
                />
                <InspectorRow
                  label="Server voice"
                  value={voiceProfile.serverTransport.sessionVoice}
                />
                <InspectorRow
                  label="Server key"
                  value={voiceProfile.serverTransport.openAiApiKeyEnvVar}
                />
                <InspectorRow
                  label="Server status"
                  value={
                    <InspectorBadge>
                      {voiceProfile.serverTransport.status}
                    </InspectorBadge>
                  }
                />
                <InspectorRow
                  label="Audio input"
                  value={voiceProfile.serverAudioLane.inputPrimitive}
                />
                <InspectorRow
                  label="Audio response"
                  value={voiceProfile.serverAudioLane.requestResponsePrimitive}
                />
                <InspectorRow
                  label="Audio status"
                  value={
                    <InspectorBadge>
                      {voiceProfile.serverAudioLane.status}
                    </InspectorBadge>
                  }
                />
                <InspectorRow
                  label="SIP transport"
                  value={voiceProfile.sipTransport.transport}
                />
                <InspectorRow
                  label="SIP route"
                  value={voiceProfile.sipTransport.routePath}
                />
                <InspectorRow
                  label="SIP key"
                  value={voiceProfile.sipTransport.openAiApiKeyEnvVar}
                />
                <InspectorRow
                  label="SIP status"
                  value={
                    <InspectorBadge>
                      {voiceProfile.sipTransport.status}
                    </InspectorBadge>
                  }
                />
                <div>
                  <p className="text-muted-foreground text-xs">
                    Server primitives
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {voiceProfile.serverTransport.sdkPrimitives.map((value) => (
                      <InspectorBadge key={value}>{value}</InspectorBadge>
                    ))}
                    <InspectorBadge>
                      {voiceProfile.serverAudioLane.interruptPrimitive}
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.serverAudioLane.outputAudioEvent}
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.serverAudioLane.outputTranscriptEvent}
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.sipTransport.connectPrimitive}
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.sipTransport.initialConfigPrimitive}
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.sipTransport.callControlContract}
                    </InspectorBadge>
                  </div>
                </div>
              </InspectorCollapsible>

              <InspectorCollapsible
                defaultOpen={false}
                summary="Twilio and Cloudflare wrappers, routes, and hosting contracts."
                title="Provider bridges"
              >
                <InspectorRow
                  label="Twilio route"
                  value={voiceProfile.twilioCallControl.routePath}
                />
                <InspectorRow
                  label="Twilio stream env"
                  value={voiceProfile.twilioCallControl.mediaStreamUrlEnvVar}
                />
                <InspectorRow
                  label="Twilio status"
                  value={
                    <InspectorBadge>
                      {voiceProfile.twilioCallControl.status}
                    </InspectorBadge>
                  }
                />
                <InspectorRow
                  label="Twilio bridge"
                  value={
                    <InspectorBadge>
                      {voiceProfile.twilioMediaStreamBridge.status}
                    </InspectorBadge>
                  }
                />
                <InspectorRow
                  label="Twilio app"
                  value={
                    <InspectorBadge>
                      {voiceProfile.twilioMediaStreamServer.status}
                    </InspectorBadge>
                  }
                />
                <InspectorRow
                  label="Cloudflare route"
                  value={voiceProfile.cloudflareWorkerApp.connectRoutePath}
                />
                <InspectorRow
                  label="Cloudflare app"
                  value={
                    <InspectorBadge>
                      {voiceProfile.cloudflareWorkerApp.status}
                    </InspectorBadge>
                  }
                />
                <InspectorRow
                  label="Cloudflare module"
                  value={
                    <InspectorBadge>
                      {voiceProfile.cloudflareWorkerModule.status}
                    </InspectorBadge>
                  }
                />
                <InspectorRow
                  label="Cloudflare worker"
                  value={
                    <InspectorBadge>
                      {voiceProfile.cloudflareWorkerRuntime.status}
                    </InspectorBadge>
                  }
                />
                <div className="space-y-2">
                  {voiceProfile.providerExtensions.map((extension) => (
                    <div
                      className="space-y-2 border border-foreground/10 px-2 py-2"
                      key={extension.id}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="min-w-0 text-sm">
                          {extension.label}
                        </span>
                        <InspectorBadge>{extension.status}</InspectorBadge>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <InspectorBadge>
                          {extension.sdkPrimitive}
                        </InspectorBadge>
                        <InspectorBadge>
                          {extension.runtimeContract}
                        </InspectorBadge>
                        <InspectorBadge>
                          {extension.workflowName}
                        </InspectorBadge>
                      </div>
                    </div>
                  ))}
                </div>
              </InspectorCollapsible>

              <InspectorCollapsible
                defaultOpen={false}
                summary="Long-form transport notes and deployment contracts."
                title="Contracts"
              >
                <div>
                  <p className="text-muted-foreground text-xs">Twilio</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <InspectorBadge>
                      {voiceProfile.twilioCallControl.transportContract}
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.twilioCallControl.sdkPrimitive}
                    </InspectorBadge>
                    <InspectorBadge>
                      {
                        voiceProfile.twilioCallControl
                          .requiredMediaStreamProtocol
                      }
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.twilioMediaStreamBridge.sdkPrimitive}
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.twilioMediaStreamBridge.hostingContract}
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.twilioMediaStreamBridge.closeBehavior}
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.twilioMediaStreamServer.serverPrimitive}
                    </InspectorBadge>
                    <InspectorBadge>
                      {
                        voiceProfile.twilioMediaStreamServer
                          .publicTransportContract
                      }
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.twilioMediaStreamServer.websocketProtocol}
                    </InspectorBadge>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Cloudflare</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <InspectorBadge>
                      {voiceProfile.cloudflareWorkerModule.modulePrimitive}
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.cloudflareWorkerModule.runtimeContract}
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.cloudflareWorkerApp.serverPrimitive}
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.cloudflareWorkerApp.publicTransportContract}
                    </InspectorBadge>
                    <InspectorBadge>
                      {
                        voiceProfile.cloudflareWorkerApp
                          .websocketUpgradePrimitive
                      }
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.cloudflareWorkerRuntime.sdkPrimitive}
                    </InspectorBadge>
                    <InspectorBadge>
                      {
                        voiceProfile.cloudflareWorkerRuntime
                          .websocketUpgradePrimitive
                      }
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.cloudflareWorkerRuntime.openEventBehavior}
                    </InspectorBadge>
                    <InspectorBadge>
                      {
                        voiceProfile.cloudflareWorkerRuntime
                          .workerCompatibilityFlag
                      }
                    </InspectorBadge>
                    <InspectorBadge>
                      {voiceProfile.cloudflareWorkerRuntime.runtimeEntryPoint}
                    </InspectorBadge>
                  </div>
                </div>
                <p className="text-muted-foreground text-xs/relaxed">
                  {voiceProfile.notes}
                </p>
              </InspectorCollapsible>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Handoffs
            </p>
            <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Configured</span>
                <span>{handoffCatalog.length}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Active agent</span>
                <span className="max-w-[10rem] text-right">
                  {lastHandoffSummary?.activeAgentName ?? "No handoff yet"}
                </span>
              </div>
              <div className="space-y-2 pt-1">
                <div>
                  <p className="text-muted-foreground text-xs">
                    Configured handoffs
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {handoffCatalog.map((item) => (
                      <Badge key={item.name} variant="outline">
                        {item.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Targets</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(lastHandoffSummary?.handoffTargetNames.length
                      ? lastHandoffSummary.handoffTargetNames
                      : ["No handoff metadata yet"]
                    ).map((value) => (
                      <Badge key={value} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Transitions</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(lastHandoffSummary?.handoffTransitions.length
                      ? lastHandoffSummary.handoffTransitions
                      : ["No handoff metadata yet"]
                    ).map((value) => (
                      <Badge key={value} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              MCP
            </p>
            <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Transport</span>
                <span>{mcpProfile.transport}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Lifecycle</span>
                <span>{mcpProfile.lifecycle}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Route</span>
                <span className="max-w-[10rem] text-right">
                  {mcpProfile.routePath}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Strict schemas</span>
                <span>
                  {mcpProfile.convertSchemasToStrict ? "enabled" : "disabled"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Active servers</span>
                <span>{lastMcpSummary?.activeServerNames.length ?? 0}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Failed servers</span>
                <span>{lastMcpSummary?.failedServerNames.length ?? 0}</span>
              </div>
              <div className="space-y-2 pt-1">
                <div>
                  <p className="text-muted-foreground text-xs">
                    SDK primitives
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {mcpProfile.sdkPrimitives.map((value) => (
                      <InspectorBadge key={value}>{value}</InspectorBadge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Configured tools
                  </p>
                  <div className="mt-1 grid gap-1.5">
                    {mcpCatalog
                      .flatMap((server) => server.toolNames)
                      .map((value) => (
                        <InspectorBadge
                          className="w-full justify-start"
                          key={value}
                        >
                          {value}
                        </InspectorBadge>
                      ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Used this run</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(lastMcpSummary?.usedToolNames.length
                      ? lastMcpSummary.usedToolNames
                      : ["No MCP tool usage yet"]
                    ).map((value) => (
                      <InspectorBadge key={value}>{value}</InspectorBadge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Failed server errors
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(lastMcpSummary?.failedServerErrors.length
                      ? lastMcpSummary.failedServerErrors
                      : ["No MCP connection errors"]
                    ).map((value) => (
                      <InspectorBadge key={value}>{value}</InspectorBadge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Sandbox
            </p>
            <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Client</span>
                <span>{sandboxProfile.clientBackend}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Agent model</span>
                <span>{sandboxProfile.agentModel}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Manifest root</span>
                <span>
                  {lastSandboxSummary?.manifestRoot ??
                    sandboxProfile.manifestRoot}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Workspace</span>
                <span>{sandboxProfile.workspaceSource}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Persistence</span>
                <span className="max-w-[10rem] text-right">
                  {sandboxProfile.sessionPersistence}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Active agent</span>
                <span className="max-w-[10rem] text-right">
                  {lastSandboxSummary?.currentAgentName ?? "No sandbox run yet"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Workspace ready</span>
                <span>
                  {lastSandboxSummary
                    ? lastSandboxSummary.workspaceReady
                      ? "yes"
                      : "no"
                    : "unknown"}
                </span>
              </div>
              <div className="space-y-2 pt-1">
                <div>
                  <p className="text-muted-foreground text-xs">Mounted paths</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(lastSandboxSummary?.mountedPaths.length
                      ? lastSandboxSummary.mountedPaths
                      : sandboxProfile.mountedPaths
                    ).map((value) => (
                      <Badge key={value} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Default capabilities
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {sandboxProfile.defaultCapabilities.map((value) => (
                      <Badge key={value} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    SDK primitives
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {sandboxProfile.sdkPrimitives.map((value) => (
                      <Badge key={value} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Persisted sessions
                  </p>
                  <p className="mt-1 text-xs/relaxed">
                    {lastSandboxSummary?.persistedSessionCount ?? 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Tracing
            </p>
            <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
              <InspectorRow
                label="Runtime default"
                value={traceProfile.defaultServerRuntimeTracing}
              />
              <InspectorRow
                label="Workflow source"
                value={traceProfile.workflowNameSource}
              />
              <InspectorRow
                label="Group strategy"
                value={traceProfile.groupingStrategy}
              />
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Tracing</span>
                <span>
                  {lastTraceSummary?.tracingDisabled ? "disabled" : "enabled"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Sensitive data</span>
                <span>
                  {traceIncludesSensitiveData ? "included" : "redacted"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Export key</span>
                <span className="max-w-[10rem] text-right">
                  {lastTraceSummary?.exportApiKeySource ??
                    traceProfile.exportApiKeySource}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Trace id</span>
                <span className="max-w-[10rem] truncate text-right">
                  {lastTraceSummary?.traceId ?? "No trace yet"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Group id</span>
                <span className="max-w-[10rem] truncate text-right">
                  {lastTraceSummary?.groupId ?? "No group yet"}
                </span>
              </div>
              <div className="space-y-2 pt-1">
                <div>
                  <p className="text-muted-foreground text-xs">
                    SDK primitives
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {traceProfile.sdkPrimitives.map((value) => (
                      <InspectorBadge key={value}>{value}</InspectorBadge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Trace metadata keys
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(lastTraceSummary?.metadataKeys.length
                      ? lastTraceSummary.metadataKeys
                      : ["No trace metadata yet"]
                    ).map((value) => (
                      <InspectorBadge key={value}>{value}</InspectorBadge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Disable switch
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <InspectorBadge>
                      {traceProfile.disableEnvVar}
                    </InspectorBadge>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Model
            </p>
            <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Model</span>
                <span className="text-right">{modelProfile.model}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">API</span>
                <span>{modelProfile.api}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Transport</span>
                <span>{modelProfile.responsesTransport}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Reasoning</span>
                <span>{modelProfile.reasoningEffort}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Verbosity</span>
                <span>{modelProfile.textVerbosity}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Provider</span>
                <span>{modelProfile.provider}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Guardrails
            </p>
            <div className="mt-2 space-y-2">
              {guardrailCatalog.map((item) => (
                <div
                  className="space-y-2 border border-foreground/10 px-3 py-2"
                  key={item.name}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-all font-medium text-sm">
                        {item.name}
                      </p>
                      <p className="break-words text-muted-foreground text-xs">
                        {item.sdkPrimitive}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        getToolAvailabilityClassName(item.availability)
                      )}
                      variant="outline"
                    >
                      {item.availability}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">{item.notes}</p>
                  {usedGuardrailNames.has(item.name) ? (
                    <Badge
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      variant="outline"
                    >
                      Evaluated this run
                    </Badge>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Approvals
            </p>
            <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Pending</span>
                <span>{lastApprovalSummary?.pendingApprovals.length ?? 0}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Decisions</span>
                <span>{lastApprovalSummary?.decisions.length ?? 0}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Paused state</span>
                <span>
                  {lastApprovalSummary?.serializedRunState
                    ? "serialized"
                    : "none"}
                </span>
              </div>
              <div className="space-y-2 pt-1">
                <div>
                  <p className="text-muted-foreground text-xs">
                    Pending approvals
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(lastApprovalSummary?.pendingApprovals.length
                      ? lastApprovalSummary.pendingApprovals.map(
                          (item) => item.toolName
                        )
                      : ["No pending approval metadata yet"]
                    ).map((value) => (
                      <Badge key={value} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Decisions</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {(lastApprovalSummary?.decisions.length
                      ? lastApprovalSummary.decisions.map((item) =>
                          item.approved ? "approved" : "rejected"
                        )
                      : ["No approval decisions yet"]
                    ).map((value, index) => (
                      <Badge key={`${value}-${index}`} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Results
            </p>
            <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Active agent</span>
                <span className="max-w-[10rem] text-right">
                  {lastResultSummary?.activeAgentName ??
                    "No settled result yet"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Last agent</span>
                <span className="max-w-[10rem] text-right">
                  {lastResultSummary?.lastAgentName ?? "No settled result yet"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">History</span>
                <span>{lastResultSummary?.historyLength ?? 0}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Output items</span>
                <span>{lastResultSummary?.outputCount ?? 0}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">New items</span>
                <span>{lastResultSummary?.newItemsCount ?? 0}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Raw responses</span>
                <span>{lastResultSummary?.rawResponseCount ?? 0}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Interruptions</span>
                <span>{lastResultSummary?.interruptionCount ?? 0}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Requests</span>
                <span>{lastResultSummary?.requestCount ?? 0}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Tokens</span>
                <span>{lastResultSummary?.totalTokens ?? 0}</span>
              </div>
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground">Run state</span>
                <span>
                  {lastResultSummary?.hasResumableState
                    ? "available"
                    : "not captured"}
                </span>
              </div>
              <div className="space-y-2 pt-1">
                <div>
                  <p className="text-muted-foreground text-xs">Final output</p>
                  <p className="mt-1 text-xs/relaxed">
                    {lastResultSummary?.finalOutputPreview ??
                      "No settled result preview yet"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Tools
            </p>
            <div className="mt-2 space-y-2">
              {toolCatalog.map((item) => (
                <div
                  className="space-y-2 border border-foreground/10 px-3 py-2"
                  key={item.name}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-all font-medium text-sm">
                        {item.name}
                      </p>
                      <p className="break-words text-muted-foreground text-xs">
                        {item.sdkPrimitive}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        getToolAvailabilityClassName(item.availability)
                      )}
                      variant="outline"
                    >
                      {item.availability}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">{item.notes}</p>
                  {usedToolNames.has(item.name) ? (
                    <Badge
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      variant="outline"
                    >
                      Used this run
                    </Badge>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Guide Coverage
            </p>
            <div className="mt-2 space-y-2">
              {guideCoverageWithCurrentRun.map((item) => (
                <div
                  className="space-y-2 border border-foreground/10 px-3 py-2"
                  key={item.id}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-all font-medium text-sm">
                        {item.label}
                      </p>
                      <p className="break-words text-muted-foreground text-xs">
                        {item.sdkPrimitive}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "shrink-0",
                        getStatusClassName(item.implementationStatus)
                      )}
                      variant="outline"
                    >
                      {getImplementationLabel(item.implementationStatus)}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-muted-foreground text-xs">
                    <p>{item.observable}</p>
                    <a
                      className="block break-all text-foreground underline-offset-4 hover:underline"
                      href={item.sourceGuide}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {item.sourceGuide}
                    </a>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={cn(getStatusClassName(item.currentRunStatus))}
                      variant="outline"
                    >
                      Run: {getRunStatusLabel(item.currentRunStatus)}
                    </Badge>
                    <Badge variant="outline">
                      Provider: {item.providerCapabilityStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
