"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { useEffect, useState } from "react";

export function UltraChatbotAgentMessageReasoning({
  isLoading,
  reasoning,
}: {
  isLoading: boolean;
  reasoning: string;
}) {
  const [hasBeenStreaming, setHasBeenStreaming] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setHasBeenStreaming(true);
    }
  }, [isLoading]);

  return (
    <Reasoning
      className="w-full"
      defaultOpen={hasBeenStreaming}
      isStreaming={isLoading}
    >
      <ReasoningTrigger />
      <ReasoningContent>{reasoning}</ReasoningContent>
    </Reasoning>
  );
}
