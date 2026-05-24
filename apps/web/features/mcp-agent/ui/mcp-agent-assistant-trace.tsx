"use client";

import { MessageResponse } from "@workspace/ui/components/ai-elements/message";
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
} from "@workspace/ui/components/ai-elements/tool";
import type { UIMessage } from "ai";

import {
  getReasoningText,
  getTextContent,
  getToolParts,
} from "./mcp-agent-model";

interface McpAgentAssistantTraceProps {
  isLastMessage: boolean;
  isStreaming: boolean;
  message: UIMessage;
}

export function McpAgentAssistantTrace({
  isLastMessage,
  isStreaming,
  message,
}: McpAgentAssistantTraceProps) {
  const text = getTextContent(message);
  const reasoningText = getReasoningText(message);
  const toolParts = getToolParts(message);
  const hasReasoning = reasoningText.length > 0;
  const hasText = text.length > 0;
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming =
    isLastMessage && isStreaming && lastPart?.type === "reasoning";
  const showThinking =
    isLastMessage && isStreaming && !hasReasoning && !hasText;

  return (
    <>
      {hasReasoning ? (
        <Reasoning className="w-full" isStreaming={isReasoningStreaming}>
          <ReasoningTrigger />
          <ReasoningContent>{reasoningText}</ReasoningContent>
        </Reasoning>
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

      {hasText ? <MessageResponse>{text}</MessageResponse> : null}
      {showThinking ? <Shimmer className="text-sm">Thinking...</Shimmer> : null}
    </>
  );
}
