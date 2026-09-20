"use client";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@workspace/ui/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@workspace/ui/components/ai-elements/reasoning";
import { isToolUIPart, type UIMessage } from "ai";
import { CanvasTool } from "./canvas-tool";

export function CanvasMessage({
  message,
  streaming,
}: {
  message: UIMessage;
  streaming: boolean;
}) {
  return (
    <Message from={message.role}>
      <MessageContent className="w-full min-w-0">
        {message.parts.map((part, index) => {
          const key = `${message.id}-${index}`;
          if (part.type === "text") {
            return <MessageResponse key={key}>{part.text}</MessageResponse>;
          }
          if (part.type === "reasoning") {
            if (!part.text.trim()) {
              return null;
            }
            return (
              <Reasoning
                isStreaming={streaming && part.state === "streaming"}
                key={key}
              >
                <ReasoningTrigger>思考过程</ReasoningTrigger>
                <ReasoningContent>{part.text}</ReasoningContent>
              </Reasoning>
            );
          }
          if (!isToolUIPart(part)) {
            return null;
          }
          return <CanvasTool key={key} part={part} streaming={streaming} />;
        })}
      </MessageContent>
    </Message>
  );
}
