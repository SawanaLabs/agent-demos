"use client";

import {
  MessageResponse,
  type MessageResponseProps,
} from "@workspace/ui/components/ai-elements/message";
import { cn } from "@workspace/ui/lib/utils";

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
