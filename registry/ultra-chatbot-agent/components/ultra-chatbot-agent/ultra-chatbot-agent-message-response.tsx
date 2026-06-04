"use client";

import {
  MessageResponse,
  type MessageResponseProps,
} from "@/components/ai-elements/message";
import { cn } from "@/lib/utils";

export function UltraChatbotAgentMessageResponse({
  className,
  ...props
}: MessageResponseProps) {
  return (
    <div
      className={cn(
        "max-w-full overflow-x-auto",
        "[&_pre]:max-w-full [&_pre]:overflow-x-auto",
        "[&_table]:min-w-max [&_table]:max-w-none",
        className
      )}
    >
      <MessageResponse {...props} />
    </div>
  );
}
