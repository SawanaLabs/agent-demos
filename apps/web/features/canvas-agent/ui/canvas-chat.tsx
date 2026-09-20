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
import Link from "next/link";
import { useState } from "react";
import { ConversationErrorMessage } from "@/features/shared/chat/ui/conversation-error-message";
import { CanvasMessage } from "./canvas-message";
import type { useCanvasAgent } from "./use-canvas-agent";

export function CanvasChat({
  controller,
  ready,
}: {
  controller: ReturnType<typeof useCanvasAgent>;
  ready: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const { busy, messages, error } = controller;
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
  if (busy) {
    heading = activity;
  }
  if (error) {
    heading = failureTitle(controller.chatFailed);
  }
  return (
    <section
      aria-label="Canvas Agent 对话"
      className="absolute right-3 bottom-3 z-10 flex w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-xl border bg-background shadow-xl sm:right-5 sm:bottom-5 sm:w-96"
    >
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div>
          <h2 className="font-medium text-sm">Canvas Agent</h2>
          <p aria-live="polite" className="text-muted-foreground text-xs">
            {heading}
          </p>
        </div>
        <Button
          aria-expanded={expanded}
          aria-label={expanded ? "收起对话" : "展开对话"}
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
          <ConversationContent className="gap-4 p-4">
            {messages.length === 0 ? (
              <div className="space-y-3 text-sm leading-relaxed">
                <p>
                  先描述工作流，再运行生成。你可以随时拖动节点、修改提示词或连接分支。
                </p>
                <Button
                  className="h-auto whitespace-normal text-left"
                  disabled={busy || !ready}
                  onClick={() =>
                    controller.send(
                      "帮我搭建一个柚子气泡水广告工作流：先写创意，再分成产品特写和户外海报两条图片分支。先不要生成。"
                    )
                  }
                  variant="secondary"
                >
                  搭建一个有两条图片分支的广告工作流
                </Button>
                <p className="text-muted-foreground text-xs">
                  支持图片与文本生成、网格图合成
                  GIF、素材输入和预览输出。直接描述需求，Agent
                  会搭建、运行并整理画布。
                </p>
                <Link
                  className="text-xs underline"
                  href="/tools/depth-video"
                  target="_blank"
                >
                  打开独立深度视频工具
                </Link>
              </div>
            ) : null}
            {messages.map((message, index) => (
              <CanvasMessage
                key={message.id}
                message={message}
                streaming={chatting && index === messages.length - 1}
              />
            ))}
            {busy ? (
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
                <p>已停止，画布中的已完成结果已保留。</p>
                <Button onClick={controller.retry} size="sm" variant="outline">
                  继续完成
                </Button>
              </div>
            ) : null}
            {ready ? null : (
              <p className="text-muted-foreground text-sm">
                配置 AI_GATEWAY_API_KEY 后即可对话和生成。现在可以手动编排画布。
              </p>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>
      {!expanded && error ? (
        <p className="px-4 pt-2 text-destructive text-xs">
          操作未完成，展开查看详情。
        </p>
      ) : null}
      <CanvasComposer controller={controller} ready={ready} />
    </section>
  );
}

function CanvasComposer({
  controller,
  ready,
}: {
  controller: ReturnType<typeof useCanvasAgent>;
  ready: boolean;
}) {
  const [input, setInput] = useState("");
  const { busy, mode } = controller;
  const chatting =
    controller.status === "submitted" || controller.status === "streaming";
  return (
    <PromptInput
      className="border-t p-3"
      onSubmit={async ({ text }) => {
        if (!text.trim() || busy || !ready) {
          return;
        }
        setInput("");
        await controller.send(text);
      }}
    >
      <PromptInputBody>
        <PromptInputTextarea
          aria-label="告诉 AI 如何修改工作流"
          className="min-h-16 resize-none"
          disabled={!ready || busy}
          onChange={(event) => setInput(event.target.value)}
          placeholder="描述工作流，或继续修改…"
          value={input}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <select
          aria-label="Agent 模式"
          className="rounded-md border bg-background p-1.5 text-xs"
          disabled={busy}
          onChange={(event) =>
            controller.setMode(event.target.value as "plan" | "execute")
          }
          value={mode}
        >
          <option value="plan">仅编排</option>
          <option value="execute">允许 AI 生成</option>
        </select>
        <PromptInputSubmit
          aria-label={chatting ? "停止生成" : "发送消息"}
          disabled={chatting ? false : busy || !ready || !input.trim()}
          onStop={controller.stop}
          status={controller.status}
        />
      </PromptInputFooter>
    </PromptInput>
  );
}

function failureTitle(chatFailed: boolean) {
  return chatFailed ? "Agent 回复中断，可继续对话" : "操作未完成";
}
