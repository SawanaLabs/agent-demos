"use client";
import {
  Node,
  NodeContent,
  NodeHeader,
} from "@workspace/ui/components/ai-elements/node";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  AlertCircleIcon,
  DownloadIcon,
  PlayIcon,
  Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import type { CanvasNode, CanvasOutput } from "../model/graph";
import styles from "./canvas-node.module.css";

export interface CanvasNodeData extends Record<string, unknown> {
  active: boolean;
  asset?: string;
  busy: boolean;
  continueFrom: () => void;
  error?: string;
  node: CanvasNode;
  output?: CanvasOutput;
  remove: () => void;
  run: () => void;
  runLabel: string;
  update: (patch: Partial<CanvasNode>) => void;
  upload: (file: File) => void;
}

export function CanvasNodeView({ data }: { data: CanvasNodeData }) {
  const { node, asset, busy, active } = data;
  const image = asset;
  return (
    <Node
      className={`${styles.node} w-80 shadow-sm ${active ? "ring-2 ring-primary" : ""}`}
      handles={{
        source: true,
        target: !["reference", "prompt"].includes(node.kind),
      }}
    >
      <NodeHeader>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {
              {
                text: "生成文本",
                image: "生成图片",
                reference: "图片输入",
                prompt: "提示词",
                output: "输出",
              }[node.kind]
            }
          </span>
          <Input
            aria-label="节点名称"
            className="nodrag h-7 flex-1 border-0 bg-transparent px-1 font-medium shadow-none"
            disabled={busy}
            onChange={(event) =>
              data.update({ label: event.target.value || "未命名" })
            }
            value={node.label}
          />
          <Button
            aria-label={`删除${node.label}`}
            className="nodrag"
            disabled={busy}
            onClick={data.remove}
            size="icon-sm"
            variant="ghost"
          >
            <Trash2Icon className="size-3.5" />
          </Button>
        </div>
      </NodeHeader>
      <NodeContent className="space-y-3">
        {data.error ? (
          <Alert className="nodrag border-destructive/40" variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>节点执行失败</AlertTitle>
            <AlertDescription>{data.error}</AlertDescription>
          </Alert>
        ) : null}
        {node.kind === "reference" ? (
          <label className="nodrag block cursor-pointer border border-dashed p-4 text-center text-muted-foreground text-sm">
            {asset ? "更换图片" : "上传图片"}
            <input
              accept="image/png,image/jpeg,image/webp"
              aria-label="上传图片"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  data.upload(file);
                }
                event.target.value = "";
              }}
              type="file"
            />
            <span className="mt-1 block text-xs">
              PNG、JPEG、WebP，最大 4 MB
            </span>
          </label>
        ) : (
          <>
            <Textarea
              aria-label={`${node.label}提示词`}
              className="nodrag nowheel min-h-28 resize-y text-sm"
              disabled={busy}
              onChange={(event) => data.update({ prompt: event.target.value })}
              placeholder={
                node.kind === "prompt"
                  ? "输入提示词或其他文本，连接后原样传给下游。"
                  : "描述生成要求，也可以通过连线传入提示词和图片。"
              }
              value={node.prompt}
            />
            {node.kind === "prompt" ? (
              <p className="text-muted-foreground text-xs">
                原样传给下游 · 不调用 AI
              </p>
            ) : (
              <div className="flex items-center justify-between gap-2">
                {node.kind === "image" ? (
                  <select
                    aria-label="画面比例"
                    className="nodrag rounded-md border bg-background p-1 text-xs"
                    disabled={busy}
                    onChange={(event) =>
                      data.update({
                        aspectRatio: event.target
                          .value as CanvasNode["aspectRatio"],
                      })
                    }
                    value={node.aspectRatio}
                  >
                    <option>16:9</option>
                    <option>1:1</option>
                    <option>9:16</option>
                  </select>
                ) : (
                  <span className="text-muted-foreground text-xs">
                    接收上游文本与图片
                  </span>
                )}
                <Button
                  className="nodrag"
                  disabled={busy}
                  onClick={data.run}
                  size="sm"
                  variant="secondary"
                >
                  <PlayIcon className="size-3" />
                  {data.runLabel}
                </Button>
              </div>
            )}
          </>
        )}
        {active ? (
          <p aria-live="polite" className="animate-pulse text-primary text-sm">
            正在生成…
          </p>
        ) : null}
        {image ? (
          <div className="space-y-2">
            <Image
              alt={node.label}
              className="nodrag max-h-72 w-full rounded-sm object-contain"
              height={240}
              src={image}
              unoptimized
              width={296}
            />
            <a
              className="nodrag flex items-center gap-1 text-xs underline"
              download={`${node.label}.png`}
              href={image}
            >
              <DownloadIcon className="size-3" />
              下载图片
            </a>
          </div>
        ) : null}
        {node.kind === "prompt" || asset ? (
          <Button
            className="nodrag w-full"
            disabled={busy}
            onClick={data.continueFrom}
            size="sm"
            variant="outline"
          >
            用于下一步
          </Button>
        ) : null}
      </NodeContent>
    </Node>
  );
}
