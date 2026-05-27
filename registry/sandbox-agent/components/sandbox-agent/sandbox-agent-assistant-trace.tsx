"use client";

import { GlobeHemisphereWestIcon } from "@phosphor-icons/react";
import { MessageResponse } from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UIMessage } from "ai";
import { getPreviewOutput, sanitizePreviewText } from "./preview-state";
import {
  getReasoningText,
  getTextContent,
  getToolParts,
  getWrittenFiles,
} from "./sandbox-agent-model";

interface SandboxAgentAssistantTraceProps {
  isLastMessage: boolean;
  isStreaming: boolean;
  message: UIMessage;
  onOpenPreview: () => void;
}

export function SandboxAgentAssistantTrace({
  isLastMessage,
  isStreaming,
  message,
  onOpenPreview,
}: SandboxAgentAssistantTraceProps) {
  const reasoningText = getReasoningText(message);
  const toolParts = getToolParts(message);
  const preview = getPreviewOutput(toolParts);
  const text = sanitizePreviewText(
    getTextContent(message),
    preview?.url ?? null
  );
  const writtenFiles = getWrittenFiles(toolParts);
  const hasReasoning = reasoningText.length > 0;
  const hasText = text.length > 0;
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming =
    isLastMessage && isStreaming && lastPart?.type === "reasoning";
  const showBodyThinking =
    isLastMessage && isStreaming && !hasReasoning && !hasText;
  let bodyContent: React.ReactNode = null;

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

      {writtenFiles.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
            Generated files
          </p>
          <div className="flex flex-wrap gap-2">
            {writtenFiles.map((filePath) => (
              <Badge key={filePath} variant="secondary">
                {filePath}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {toolParts.map((part) => (
        <Tool key={part.toolCallId}>
          {part.type === "dynamic-tool" ? (
            <ToolHeader
              state={part.state}
              toolName={part.toolName}
              type={part.type}
            />
          ) : (
            <ToolHeader state={part.state} type={part.type} />
          )}
          <ToolContent>
            {part.input ? <ToolInput input={part.input} /> : null}
            <ToolOutput errorText={part.errorText} output={part.output} />
          </ToolContent>
        </Tool>
      ))}

      {preview?.url ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{preview.directory ?? "."}</Badge>
            <Badge variant="outline">port {preview.port ?? 3000}</Badge>
            {preview.entryPath ? (
              <Badge variant="secondary">{preview.entryPath}</Badge>
            ) : null}
          </div>

          <Button
            className="w-fit"
            onClick={onOpenPreview}
            type="button"
            variant="outline"
          >
            <GlobeHemisphereWestIcon className="size-4" />
            Open preview
          </Button>
        </div>
      ) : null}

      {bodyContent}
    </>
  );
}
