"use client";
import type { UseChatHelpers } from "@ai-sdk/react";
import { type FileUIPart, isToolUIPart, type UIMessage } from "ai";
import { type RefObject, useRef, useState } from "react";

export function useCanvasChatActions(
  chat: UseChatHelpers<UIMessage>,
  busyRef: RefObject<boolean>,
  setError: (error: string | null) => void,
  clearActive: () => void
) {
  const requestMode = useRef<"plan" | undefined>(undefined);
  const [stopped, setStopped] = useState(false);
  async function send(text: string, mode?: "plan", files?: FileUIPart[]) {
    if (busyRef.current || !(text.trim() || files?.length)) {
      return;
    }
    requestMode.current = mode;
    busyRef.current = true;
    setError(null);
    setStopped(false);
    chat.clearError();
    try {
      await chat.sendMessage(
        text.trim() ? { files, text } : { files: files ?? [] },
        mode ? { body: { mode } } : undefined
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message || "发送失败，请重试。"
          : "发送失败，请重试。"
      );
    } finally {
      busyRef.current = false;
    }
  }
  async function retry() {
    if (busyRef.current) {
      return;
    }
    const last = chat.messages.at(-1);
    if (
      last?.role === "assistant" &&
      last.parts.some((part) => part.type.startsWith("tool-"))
    ) {
      await send(canvasRetryMessage(last), requestMode.current);
      return;
    }
    busyRef.current = true;
    setError(null);
    setStopped(false);
    chat.clearError();
    try {
      await chat.regenerate(
        requestMode.current
          ? { body: { mode: requestMode.current } }
          : undefined
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message || "重试失败。" : "重试失败。"
      );
    } finally {
      busyRef.current = false;
    }
  }
  return {
    send,
    retry,
    stopped,
    reset: () => setStopped(false),
    stop: () => {
      chat.stop();
      clearActive();
      setStopped(true);
    },
  };
}

export function canvasRetryMessage(message: UIMessage) {
  const failed = message.parts.some(
    (part) =>
      isToolUIPart(part) &&
      (part.state === "output-error" ||
        (part.state === "output-available" &&
          part.output &&
          typeof part.output === "object" &&
          "error" in part.output))
  );
  return failed
    ? "请继续说明上一轮工具执行的结果、失败原因和下一步建议。不要重新运行节点，不要再次尝试生成。"
    : "请继续完成上一条需求。先检查画布，复用已有节点和已完成结果，只执行尚未完成的部分。";
}
