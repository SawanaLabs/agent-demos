"use client";

import { useDemoChat } from "@/features/shared/chat/ui/use-demo-chat";
import type { TraceEvalAgentMessage } from "../model/trace-eval-run-record";

export function useTraceEvalAgentChat() {
  return useDemoChat<TraceEvalAgentMessage>({
    api: "/api/demos/trace-eval-agent",
  });
}
