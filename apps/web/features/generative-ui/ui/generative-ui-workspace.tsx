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
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@workspace/ui/components/ai-elements/tool";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import type { UIMessage } from "ai";
import {
  BotIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  SquareIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import {
  ConversationErrorMessage,
  useConversationErrorRetry,
} from "@/features/shared/chat/ui/conversation-error-message";

import { FeatureComparisonMatrix } from "./feature-comparison-matrix";
import {
  featureComparisonToolPartType,
  type GenerativeUiToolPart,
  planRecommendationToolPartType,
  projectGenerativeUiMessage,
} from "./message-parts";
import { PlanRecommendationCard } from "./plan-recommendation-card";
import { useGenerativeUiChat } from "./use-generative-ui-chat";

const generativeUiSamplePrompts = [
  "Compare the current AI app builder options for a small SaaS team.",
  "Which AI coding assistant should I pick this month for a TypeScript monorepo?",
  "Compare RAG, tool calling, and workflow agents for a support chatbot.",
  "Recommend the best agent pattern for a demo that must ship in 30 minutes.",
] as const;

function getLatestAssistantMessage(messages: UIMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];

    if (message?.role === "assistant") {
      return message;
    }
  }

  return;
}

function getToolDisplayTitle(partType: string) {
  if (partType === "tool-web_search") {
    return "Web search";
  }

  return "Auxiliary tool";
}

function getGenerativeUiToolOutputTitle(partType: string) {
  if (partType === featureComparisonToolPartType) {
    return "Feature comparison tool output";
  }

  if (partType === planRecommendationToolPartType) {
    return "Plan recommendation tool output";
  }

  return "Generative UI tool output";
}

function GenerativeUiToolOutputPanel({ part }: { part: GenerativeUiToolPart }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Tool
      className="bg-muted/20"
      onOpenChange={(nextOpen) => setIsOpen(nextOpen)}
      open={isOpen}
    >
      <ToolHeader
        state={part.state}
        title={getGenerativeUiToolOutputTitle(part.type)}
        type={part.type}
      />
      <ToolContent>
        {part.input ? <ToolInput input={part.input} /> : null}
        <ToolOutput errorText={part.errorText} output={part.output} />
        {part.output || part.errorText ? null : (
          <div className="space-y-2">
            <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Result
            </h4>
            <div className="rounded-md bg-muted/50 px-3 py-2 text-muted-foreground text-xs">
              Waiting for tool output.
            </div>
          </div>
        )}
      </ToolContent>
    </Tool>
  );
}

function renderGenerativeUiToolOutputPart(part: GenerativeUiToolPart) {
  return (
    <GenerativeUiToolOutputPanel
      key={`${part.toolCallId}-tool-output`}
      part={part}
    />
  );
}

function renderGenerativeUiToolPart(part: GenerativeUiToolPart) {
  if (part.type === featureComparisonToolPartType) {
    return <FeatureComparisonMatrix key={part.toolCallId} part={part} />;
  }

  if (part.type === planRecommendationToolPartType) {
    return <PlanRecommendationCard key={part.toolCallId} part={part} />;
  }

  return null;
}

function GenerativeUiSources({
  sources,
}: {
  sources: ReturnType<typeof projectGenerativeUiMessage>["sourceUrlParts"];
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
            key={`${source.sourceId}-${source.url}`}
            title={source.title ?? source.url}
          />
        ))}
      </SourcesContent>
    </Sources>
  );
}

export function GenerativeUiAssistantMessage({
  isStreaming,
  message,
}: {
  isStreaming: boolean;
  message: UIMessage;
}) {
  const projection = projectGenerativeUiMessage(message);
  const hasReasoningText = projection.reasoningText.length > 0;
  const isReasoningStreaming =
    isStreaming && message.parts.at(-1)?.type === "reasoning";
  const shouldRenderReasoning = hasReasoningText || isReasoningStreaming;
  const hasVisibleOutput =
    shouldRenderReasoning ||
    projection.text.length > 0 ||
    projection.uiToolParts.length > 0 ||
    projection.sourceUrlParts.length > 0 ||
    projection.auxiliaryToolParts.length > 0;
  const reasoningNode = shouldRenderReasoning ? (
    <Reasoning className="w-full" isStreaming={isReasoningStreaming}>
      <ReasoningTrigger />
      {hasReasoningText ? (
        <ReasoningContent>{projection.reasoningText}</ReasoningContent>
      ) : null}
    </Reasoning>
  ) : null;

  return (
    <div className="space-y-4">
      {reasoningNode}

      {projection.uiToolParts.map(renderGenerativeUiToolOutputPart)}

      {projection.text ? (
        <MessageResponse>{projection.text}</MessageResponse>
      ) : null}

      {projection.uiToolParts.map(renderGenerativeUiToolPart)}

      <GenerativeUiSources sources={projection.sourceUrlParts} />

      {projection.auxiliaryToolParts.map((part) => (
        <Tool className="bg-muted/20" key={part.toolCallId}>
          {part.type === "dynamic-tool" ? (
            <ToolHeader
              state={part.state}
              title={part.toolName}
              toolName={part.toolName}
              type={part.type}
            />
          ) : (
            <ToolHeader
              state={part.state}
              title={getToolDisplayTitle(part.type)}
              type={part.type}
            />
          )}
          <ToolContent>
            {part.input ? <ToolInput input={part.input} /> : null}
            <ToolOutput errorText={part.errorText} output={part.output} />
          </ToolContent>
        </Tool>
      ))}

      {hasVisibleOutput ? null : (
        <p className="text-muted-foreground text-sm">
          {isStreaming ? "Thinking..." : "Waiting for visible output."}
        </p>
      )}
    </div>
  );
}

function GenerativeUiMessage({
  isStreaming,
  message,
}: {
  isStreaming: boolean;
  message: UIMessage;
}) {
  const projection = projectGenerativeUiMessage(message);
  let messageBody: ReactNode;

  if (message.role === "assistant") {
    messageBody = (
      <GenerativeUiAssistantMessage
        isStreaming={isStreaming}
        message={message}
      />
    );
  } else if (projection.text) {
    messageBody = <MessageResponse>{projection.text}</MessageResponse>;
  } else {
    messageBody = (
      <p className="text-muted-foreground text-sm">
        Waiting for visible output.
      </p>
    );
  }

  return (
    <Message from={message.role} key={message.id}>
      <MessageContent
        className={
          message.role === "assistant"
            ? "w-full max-w-4xl overflow-visible"
            : "max-w-2xl"
        }
      >
        {messageBody}
      </MessageContent>
    </Message>
  );
}

export interface GenerativeUiWorkspaceProps {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
}

export function GenerativeUiWorkspace({
  chatModel,
  isChatAvailable,
  nodeVersion,
  setupMessage,
}: GenerativeUiWorkspaceProps) {
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
  } = useGenerativeUiChat();
  const retryConversationError = useConversationErrorRetry({
    clearError,
    regenerate,
  });
  const latestAssistantMessage = getLatestAssistantMessage(messages);

  return (
    <div className="grid min-h-[70svh] min-w-0 gap-4 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <section className="flex min-h-[70svh] min-w-0 flex-col border border-foreground/10 bg-background lg:h-full lg:min-h-0">
        {isChatAvailable ? null : (
          <div className="border-foreground/10 border-b px-4 py-3 text-muted-foreground text-xs/relaxed">
            {setupMessage}
          </div>
        )}

        <Conversation className="min-h-0">
          <ConversationContent className="mx-auto flex w-full max-w-4xl flex-1 gap-6 px-4 py-6">
            {hasMessages || error ? (
              <>
                {messages.map((message) => (
                  <GenerativeUiMessage
                    isStreaming={
                      status === "streaming" &&
                      message.id === latestAssistantMessage?.id
                    }
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
                description="Ask for a comparison or a recommendation. Current questions can use search before the visual answer is generated."
                icon={<SparklesIcon className="size-5" />}
                title="Generative UI workspace is ready"
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-foreground/10 border-t px-4 py-4">
          <div className="mx-auto w-full max-w-4xl">
            <PromptInput onSubmit={({ text }) => sendMessage({ text })}>
              <PromptInputBody>
                <PromptInputTextarea
                  disabled={!isChatAvailable || isBusy}
                  placeholder="Ask for a comparison, recommendation, or current research-backed decision."
                />
              </PromptInputBody>
              <PromptInputFooter className="flex items-center justify-between gap-3 border-foreground/10 border-t px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">AI SDK 6</Badge>
                  <Badge variant="outline">Generative UI</Badge>
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
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {generativeUiSamplePrompts.map((prompt) => (
                  <Button
                    className="h-auto justify-start whitespace-normal py-2 text-left"
                    disabled={!isChatAvailable || isBusy}
                    key={prompt}
                    onClick={() => sendMessage({ text: prompt })}
                    size="sm"
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
      </section>

      <aside className="min-w-0 border border-foreground/10 bg-background p-4 lg:min-h-0 lg:overflow-y-auto">
        <div className="space-y-4">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Runtime
            </p>
            <p className="mt-1 font-medium text-sm">{nodeVersion}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Tools
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">showFeatureComparison</Badge>
              <Badge variant="outline">showPlanRecommendation</Badge>
              <Badge variant="outline">
                <SearchIcon className="size-3" />
                web_search
              </Badge>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
              Output
            </p>
            <p className="mt-1 text-muted-foreground text-sm">
              Comparison matrix or recommendation card, selected by the model
              during the chat run.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
