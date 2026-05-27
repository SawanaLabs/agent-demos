"use client";

import { MessageResponse } from "@/components/ai-elements/message";
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
} from "@/components/ai-elements/tool";
import type { UIMessage } from "ai";

import { buildTraceEvalSnapshot } from "@/lib/trace-eval-agent/model/trace-eval-snapshot";
import {
  getReasoningText,
  getTextContent,
  getToolDisplayName,
  getToolParts,
  hasVisibleToolPayload,
} from "./trace-eval-agent-model";

interface TraceEvalAgentAssistantMessageProps {
  isStreaming: boolean;
  message: UIMessage;
}

export function TraceEvalAgentAssistantMessage({
  isStreaming,
  message,
}: TraceEvalAgentAssistantMessageProps) {
  const reasoning = getReasoningText(message);
  const answer = getTextContent(message);
  const toolParts = getToolParts(message).filter(hasVisibleToolPayload);
  const hasReasoning = reasoning.length > 0;
  const hasAnswer = answer.length > 0;
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming = isStreaming && lastPart?.type === "reasoning";
  const showThinking = isStreaming && !hasReasoning && !hasAnswer;
  const snapshot = buildTraceEvalSnapshot([message], isStreaming);

  return (
    <div className="space-y-4">
      {hasReasoning ? (
        <Reasoning
          className="rounded-md border border-foreground/10 px-3 py-2"
          isStreaming={isReasoningStreaming}
        >
          <ReasoningTrigger />
          <ReasoningContent>{reasoning}</ReasoningContent>
        </Reasoning>
      ) : null}

      {toolParts.map((part) => (
        <Tool className="bg-muted/20" key={part.toolCallId}>
          {part.type === "dynamic-tool" ? (
            <ToolHeader
              state={part.state}
              title={getToolDisplayName(part)}
              toolName={part.toolName}
              type={part.type}
            />
          ) : (
            <ToolHeader
              state={part.state}
              title={getToolDisplayName(part)}
              type={part.type}
            />
          )}
          <ToolContent>
            {part.input ? <ToolInput input={part.input} /> : null}
            <ToolOutput errorText={part.errorText} output={part.output} />
          </ToolContent>
        </Tool>
      ))}

      {snapshot.sources.length > 0 ? (
        <Sources>
          <SourcesTrigger count={snapshot.sources.length} />
          <SourcesContent>
            {snapshot.sources.map((source) => (
              <Source href={source.url} key={source.url} title={source.title} />
            ))}
          </SourcesContent>
        </Sources>
      ) : null}

      {hasAnswer ? <MessageResponse>{answer}</MessageResponse> : null}
      {showThinking ? <Shimmer className="text-sm">Thinking...</Shimmer> : null}
    </div>
  );
}
