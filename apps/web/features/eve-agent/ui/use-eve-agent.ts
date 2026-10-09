"use client";

import type { ChatStatus } from "ai";
import {
  defaultMessageReducer,
  type EveMessage,
  useEveAgent as useEveAgentReact,
} from "eve/react";
import { useCallback, useMemo } from "react";

import type { EveAgentUIMessage } from "../types";

const AGENT_NAME = "service-triage";

/**
 * Wraps `useEveAgent` from `eve/react` with the useChat-shaped surface the
 * workspace expects (sendMessage / stop / status / messages / regenerate).
 *
 * `useEveAgent` returns `data.messages` projected by `defaultMessageReducer`
 * — eve's UIMessage-compatible projection — so message parts flow straight
 * through to the existing rendering code unchanged.
 */
export function useEveAgent() {
  const agent = useEveAgentReact({
    agent: AGENT_NAME,
    reducer: defaultMessageReducer(),
  });

  const messages = useMemo<EveAgentUIMessage[]>(
    () =>
      agent.data.messages.map(
        (message: EveMessage) => message as unknown as EveAgentUIMessage
      ),
    [agent.data.messages]
  );

  const status: ChatStatus = useMemo(() => {
    if (agent.status === "submitted" || agent.status === "streaming") {
      return agent.status;
    }
    if (agent.status === "error") {
      return "error";
    }
    return "ready";
  }, [agent.status]);

  const isBusy = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;
  const error = agent.error;

  const sendMessage = useCallback(
    async ({ text }: { text: string }) => {
      await agent.send(text);
    },
    [agent]
  );

  const regenerate = useCallback(async () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const lastUserText = lastUser?.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { text?: string }).text ?? "")
      .join("\n")
      .trim();
    if (lastUserText) {
      await agent.send(lastUserText);
    }
  }, [agent, messages]);

  const stop = useCallback(async () => {
    await agent.cancel();
  }, [agent]);

  const clearError = useCallback(() => {
    agent.reset();
  }, [agent]);

  return {
    chat: null as unknown as ChatStatus,
    clearError,
    error,
    hasMessages,
    isBusy,
    messages,
    regenerate,
    sendMessage,
    status,
    stop,
  };
}
