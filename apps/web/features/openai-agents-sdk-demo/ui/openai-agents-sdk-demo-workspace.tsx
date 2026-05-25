"use client";

import { ArrowClockwiseIcon, RobotIcon, StopIcon } from "@phosphor-icons/react";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  Attachments,
} from "@workspace/ui/components/ai-elements/attachments";
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

import type { OpenAiAgentsSdkDemoMessage } from "../message-metadata";
import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";
import type { OpenAiAgentsSdkDemoGuardrailCatalogEntry } from "../server/guardrails";
import type { OpenAiAgentsSdkDemoGuideCoverage } from "../server/guide-coverage";
import type { OpenAiAgentsSdkDemoModelProfile } from "../server/models";
import type { OpenAiAgentsSdkDemoToolCatalogEntry } from "../server/tools";
import {
  getOpenAiAgentsSdkDemoFileParts,
  getOpenAiAgentsSdkDemoMessageText,
  getOpenAiAgentsSdkDemoToolName,
  getOpenAiAgentsSdkDemoToolParts,
  hasOpenAiAgentsSdkDemoVisibleContent,
} from "./openai-agents-sdk-demo-session";

function ThinkingState() {
  return <Shimmer className="text-sm">Thinking...</Shimmer>;
}

function OpenAiAgentsSdkDemoToolTrace({ part }: { part: ToolPart }) {
  const toolName = getOpenAiAgentsSdkDemoToolName(part);

  return (
    <Tool>
      {part.type === "dynamic-tool" ? (
        <ToolHeader
          state={part.state}
          title={toolName}
          toolName={toolName}
          type={part.type}
        />
      ) : (
        <ToolHeader state={part.state} title={toolName} type={part.type} />
      )}
      <ToolContent>
        {part.input ? <ToolInput input={part.input} /> : null}
        <ToolOutput errorText={part.errorText} output={part.output} />
      </ToolContent>
    </Tool>
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
  chatModel: string;
  guardrailCatalog: OpenAiAgentsSdkDemoGuardrailCatalogEntry[];
  guideCoverage: OpenAiAgentsSdkDemoGuideCoverage[];
  isChatAvailable: boolean;
  modelProfile: OpenAiAgentsSdkDemoModelProfile;
  nodeVersion: string;
  setupMessage: string | null;
  toolCatalog: OpenAiAgentsSdkDemoToolCatalogEntry[];
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

export function OpenAiAgentsSdkDemoWorkspace({
  chatModel,
  guardrailCatalog,
  guideCoverage,
  isChatAvailable,
  modelProfile,
  nodeVersion,
  setupMessage,
  toolCatalog,
}: OpenAiAgentsSdkDemoWorkspaceProps) {
  const {
    error,
    hasMessages,
    isBusy,
    messages,
    regenerate,
    sendMessage,
    status,
    stop,
  } = useDemoChat<OpenAiAgentsSdkDemoMessage>({
    api: "/api/demos/openai-agents-sdk-demo",
  });
  const hasAssistantOutput = messages.some(
    (message) =>
      message.role === "assistant" && hasOpenAiAgentsSdkDemoVisibleContent(message)
  );
  const usedGuideIds = new Set(
    messages.flatMap((message) => message.metadata?.usedGuideIds ?? [])
  );
  const usedToolNames = new Set(
    messages.flatMap((message) => message.metadata?.usedToolNames ?? [])
  );
  const usedGuardrailNames = new Set(
    messages.flatMap((message) => message.metadata?.usedGuardrailNames ?? [])
  );
  const guideCoverageWithCurrentRun = guideCoverage.map((item) =>
    (((item.id === "agents" || item.id === "models") && hasAssistantOutput) ||
      usedGuideIds.has(item.id))
      ? {
          ...item,
          currentRunStatus: "used-this-run" as const,
        }
      : item
  );

  return (
    <div className="grid min-h-[70svh] gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
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
              messages.map((message) => {
                const text = getOpenAiAgentsSdkDemoMessageText(message).trim();
                const fileParts = getOpenAiAgentsSdkDemoFileParts(message);
                const toolParts = getOpenAiAgentsSdkDemoToolParts(message);
                const hasVisibleContent =
                  text.length > 0 ||
                  fileParts.length > 0 ||
                  toolParts.length > 0;

                return (
                  <Message from={message.role} key={message.id}>
                    <MessageContent
                      className={cn(
                        "space-y-4",
                        message.role === "assistant" ? "max-w-3xl" : "max-w-2xl"
                      )}
                    >
                      {text ? <MessageResponse>{text}</MessageResponse> : null}

                      {toolParts.map((part) => (
                        <OpenAiAgentsSdkDemoToolTrace
                          key={part.toolCallId}
                          part={part}
                        />
                      ))}

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

                      {text ||
                      message.role !== "assistant" ||
                      !isBusy ? null : (
                        <ThinkingState />
                      )}
                      {hasVisibleContent ||
                      (message.role === "assistant" && isBusy) ? null : (
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
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-foreground/10 border-t px-4 py-4">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput onSubmit={({ text }) => sendMessage({ text })}>
              <PromptInputBody>
                <PromptInputTextarea
                  disabled={!isChatAvailable || isBusy}
                  placeholder="Ask for a plan, a short explanation, or a demo-specific agent answer."
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
                    disabled={!isChatAvailable}
                    status={status}
                  />
                </div>
              </PromptInputFooter>
            </PromptInput>
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
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="truncate text-muted-foreground text-xs">
                        {item.sdkPrimitive}
                      </p>
                    </div>
                    <Badge
                      className={cn(getToolAvailabilityClassName(item.availability))}
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
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="truncate text-muted-foreground text-xs">
                        {item.sdkPrimitive}
                      </p>
                    </div>
                    <Badge
                      className={cn(getToolAvailabilityClassName(item.availability))}
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
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="truncate text-muted-foreground text-xs">
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
                      className="block truncate text-foreground underline-offset-4 hover:underline"
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
