"use client";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@workspace/ui/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@workspace/ui/components/ai-elements/message";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { ArrowUpIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ConversationErrorMessage } from "@/features/shared/chat/ui/conversation-error-message";
import type { useCanvasAgent } from "./use-canvas-agent";

export function CanvasChat({
  controller,
  ready,
}: {
  controller: ReturnType<typeof useCanvasAgent>;
  ready: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [input, setInput] = useState("");
  const { busy, messages, error, mode } = controller;
  const toolStatus = (part: { state?: unknown }) => {
    if (part.state === "output-available") {
      return " · 已完成";
    }
    return part.state === "output-error" ? " · 失败" : " · 处理中";
  };
  const submit = () => {
    if (!input.trim() || busy || !ready) {
      return;
    }
    const text = input;
    setInput("");
    void controller.send(text);
  };
  return (
    <section
      aria-label="Canvas Agent 对话"
      className="absolute right-3 bottom-3 z-10 flex w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-xl border bg-background shadow-xl sm:right-5 sm:bottom-5 sm:w-96"
    >
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div>
          <h2 className="font-medium text-sm">Canvas Agent</h2>
          <p aria-live="polite" className="text-muted-foreground text-xs">
            {busy ? "正在工作，收起后继续运行" : "说出想法，一起搭建工作流"}
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
                  支持文本生成、参考图和图片生成。视频、GIF 与深度节点尚未接入。
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
            {messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return (
                        <MessageResponse key={`${message.id}-${index}`}>
                          {part.text}
                        </MessageResponse>
                      );
                    }
                    if (part.type.startsWith("tool-")) {
                      return (
                        <p
                          className="my-2 text-muted-foreground text-xs"
                          key={`${message.id}-${index}`}
                        >
                          {part.type === "tool-editWorkflow"
                            ? "编辑工作流"
                            : "执行工作流"}
                          {toolStatus("state" in part ? part : {})}
                        </p>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))}
            {error ? (
              <ConversationErrorMessage error={error} title="操作未完成" />
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
      <form
        className="border-t p-3"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Textarea
          aria-label="告诉 AI 如何修改工作流"
          className="min-h-16 resize-none border-0 shadow-none focus-visible:ring-0"
          disabled={!ready}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="描述工作流，或继续修改…"
          value={input}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
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
          <Button
            aria-label="发送消息"
            disabled={busy || !ready || !input.trim()}
            size="icon-sm"
            type="submit"
          >
            <ArrowUpIcon />
          </Button>
        </div>
      </form>
    </section>
  );
}
