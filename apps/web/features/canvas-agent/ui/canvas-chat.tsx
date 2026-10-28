"use client";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@workspace/ui/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@workspace/ui/components/ai-elements/prompt-input";
import { Button } from "@workspace/ui/components/button";
import { Spinner } from "@workspace/ui/components/spinner";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { PageText, usePageCopy } from "@/components/page-copy";
import { ConversationErrorMessage } from "@/features/shared/chat/ui/conversation-error-message";
import { CanvasMessage } from "./canvas-message";
import {
  CanvasPhotoInput,
  CanvasPhotoPreviews,
  useChatPhotos,
} from "./canvas-photo-input";
import { CanvasWelcome } from "./canvas-welcome";
import type { useCanvasAgent } from "./use-canvas-agent";

export function CanvasChat({
  controller,
  ready,
}: {
  controller: ReturnType<typeof useCanvasAgent>;
  ready: boolean;
}) {
  const pageCopy = usePageCopy();

  const photos = useChatPhotos(controller.setError);
  const [userExpanded, setExpanded] = useState(true);
  const lastUserMessage = controller.messages
    .filter((message) => message.role === "user")
    .at(-1)?.id;
  useEffect(() => {
    if (lastUserMessage) {
      setExpanded(true);
    }
  }, [lastUserMessage]);
  const expanded = userExpanded;
  const { busy, messages, error } = controller;
  const agentBusy = busy;
  const chatting =
    controller.status === "submitted" || controller.status === "streaming";
  const activeLabel = controller.graph.nodes.find(
    (node) => node.id === controller.activeNode
  )?.label;
  let activity = "Agent 正在处理…";
  if (controller.status === "submitted") {
    activity = "请求已发送，等待 Agent 响应…";
  }
  if (activeLabel) {
    activity = `正在执行：${activeLabel}`;
  }
  let heading = "说出想法，一起搭建工作流";
  if (controller.stopped) {
    heading = "已停止，可继续完成";
  }
  if (agentBusy) {
    heading = activity;
  }
  if (error) {
    heading = failureTitle(controller.chatFailed);
  }
  return (
    <section
      aria-label={pageCopy("Canvas Agent 对话")}
      className="absolute right-2 bottom-3 z-10 flex w-[calc(100%-1rem)] flex-col overflow-hidden rounded-xl border bg-background shadow-xl sm:right-5 sm:bottom-5 sm:w-96"
    >
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div>
          <h2 className="font-medium text-sm">
            <PageText>{"Canvas Agent"}</PageText>
          </h2>
          <p aria-live="polite" className="text-muted-foreground text-xs">
            {heading}
          </p>
        </div>
        <Button
          aria-expanded={expanded}
          aria-label={expanded ? pageCopy("收起对话") : pageCopy("展开对话")}
          onClick={() => setExpanded(!expanded)}
          size="icon-sm"
          variant="ghost"
        >
          {expanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
        </Button>
      </div>
      <div
        className={
          expanded ? "flex h-[min(38vh,360px)] min-h-0 flex-col" : "hidden"
        }
      >
        <Conversation>
          <ConversationContent className="gap-4 p-3 sm:p-4">
            {messages.length === 0 ? (
              <CanvasWelcome
                disabled={busy || photos.uploading || !ready}
                onChoose={async (text) => {
                  const files = photos.files;
                  photos.clear();
                  await controller.send(text, "plan", files);
                }}
              />
            ) : null}
            {messages.map((message, index) => (
              <CanvasMessage
                canChoose={!busy && ready && index === messages.length - 1}
                key={message.id}
                message={message}
                onChoose={controller.send}
                streaming={chatting && index === messages.length - 1}
              />
            ))}
            {agentBusy ? (
              <div
                className="flex items-center gap-2 text-muted-foreground text-sm"
                role="status"
              >
                <Spinner className="size-4" />
                {activity}
              </div>
            ) : null}
            {error ? (
              <div role="alert">
                <ConversationErrorMessage
                  error={error}
                  isRetryDisabled={busy}
                  onRetry={controller.chatFailed ? controller.retry : undefined}
                  retryLabel="继续对话"
                  title={failureTitle(controller.chatFailed)}
                />
              </div>
            ) : null}
            {controller.stopped && !busy ? (
              <div className="space-y-2 text-sm">
                <p>
                  <PageText>{"已停止，画布中的已完成结果已保留。"}</PageText>
                </p>
                <Button onClick={controller.retry} size="sm" variant="outline">
                  <PageText>{"继续完成"}</PageText>
                </Button>
              </div>
            ) : null}
            {ready ? null : (
              <p className="text-muted-foreground text-sm">
                <PageText>
                  {"Agent 暂时不可用。你仍可编辑、保存和打开画布。"}
                </PageText>
              </p>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>
      {!expanded && error ? (
        <p className="px-4 pt-2 text-destructive text-xs">
          <PageText>{"操作未完成，展开查看详情。"}</PageText>
        </p>
      ) : null}
      <CanvasComposer
        controller={controller}
        onStop={() => {
          controller.stop();
        }}
        photos={photos}
        ready={ready}
      />
    </section>
  );
}

function CanvasComposer({
  photos,
  controller,
  ready,
  onStop,
}: {
  controller: ReturnType<typeof useCanvasAgent>;
  ready: boolean;
  onStop: () => void;
  photos: ReturnType<typeof useChatPhotos>;
}) {
  const pageCopy = usePageCopy();

  const [input, setInput] = useState("");
  const { busy, mode } = controller;
  const isBusy = busy || photos.uploading;
  const chatting =
    controller.status === "submitted" || controller.status === "streaming";
  return (
    <PromptInput
      className="border-t p-3"
      onSubmit={async ({ text }) => {
        if ((!text.trim() && photos.files.length === 0) || isBusy || !ready) {
          return;
        }
        setInput("");
        const files = photos.files;
        photos.clear();
        await controller.send(text, undefined, files);
      }}
    >
      <PromptInputBody>
        <CanvasPhotoPreviews disabled={isBusy} photos={photos} />
        <PromptInputTextarea
          aria-label={pageCopy("告诉 AI 如何修改工作流")}
          className="min-h-16 resize-none"
          disabled={!ready || isBusy}
          onChange={(event) => setInput(event.target.value)}
          placeholder={pageCopy("描述想法，或上传图片一起聊…")}
          value={input}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <div className="flex items-center gap-2">
          <CanvasPhotoInput disabled={isBusy} photos={photos} />
          <select
            aria-label={pageCopy("Agent 模式")}
            className="rounded-md border bg-background p-1.5 text-xs"
            disabled={busy}
            onChange={(event) =>
              controller.setMode(event.target.value as "plan" | "execute")
            }
            value={mode}
          >
            <option value="plan">
              <PageText>{"仅编排"}</PageText>
            </option>
            <option value="execute">
              <PageText>{"允许 AI 生成"}</PageText>
            </option>
          </select>
        </div>
        <PromptInputSubmit
          aria-label={chatting ? pageCopy("停止生成") : pageCopy("发送消息")}
          disabled={
            chatting
              ? false
              : isBusy || !ready || (!input.trim() && photos.files.length === 0)
          }
          onStop={onStop}
          status={controller.status}
        />
      </PromptInputFooter>
    </PromptInput>
  );
}

function failureTitle(chatFailed: boolean) {
  return chatFailed ? "Agent 回复中断，可继续对话" : "操作未完成";
}
