"use client";

import { Conversation } from "@workspace/ui/components/ai-elements/conversation";
import type { ComponentProps } from "react";

import { DemoSessionResetButton } from "@/components/demo-session";

export function DemoConversation(props: ComponentProps<typeof Conversation>) {
  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col"
      data-demo-conversation=""
    >
      <div className="flex shrink-0 justify-end border-b px-4 py-2">
        <DemoSessionResetButton />
      </div>
      <Conversation {...props} />
    </div>
  );
}
