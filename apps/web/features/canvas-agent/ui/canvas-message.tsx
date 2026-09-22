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
import { Button } from "@workspace/ui/components/button";
import { isToolUIPart, type UIMessage } from "ai";
import Image from "next/image";
import { questionSchema } from "../model/chat-attachments";
import { CanvasTool } from "./canvas-tool";

export function CanvasMessage({
  message,
  streaming,
  canChoose,
  onChoose,
}: {
  message: UIMessage;
  streaming: boolean;
  canChoose: boolean;
  onChoose: (text: string) => Promise<void>;
}) {
  return (
    <Message from={message.role}>
      <MessageContent className="w-full min-w-0">
        {message.parts.map((part, index) => {
          const key = `${message.id}-${index}`;
          if (part.type === "file" && part.mediaType.startsWith("image/")) {
            return (
              <Image
                alt={part.filename ?? "上传的照片"}
                className="h-auto max-h-44 w-auto rounded-lg object-contain"
                height={180}
                key={key}
                src={part.url}
                unoptimized
                width={240}
              />
            );
          }
          if (
            part.type === "tool-askQuestion" &&
            part.state === "output-available"
          ) {
            const result = questionSchema.safeParse(part.output);
            if (!result.success) {
              return null;
            }
            return (
              <div className="space-y-2 text-sm" key={key}>
                <p>{result.data.question}</p>
                <div className="flex flex-wrap gap-2">
                  {result.data.options.map((option) => (
                    <Button
                      className="h-auto whitespace-normal text-left"
                      disabled={!canChoose}
                      key={option}
                      onClick={() =>
                        onChoose(
                          `针对“${result.data.question}”，我选择：${option}`
                        )
                      }
                      size="sm"
                      variant="outline"
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            );
          }
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
