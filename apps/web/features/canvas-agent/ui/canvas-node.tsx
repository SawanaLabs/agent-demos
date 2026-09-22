"use client";
import {
  Node,
  NodeContent,
  NodeFooter,
  NodeHeader,
} from "@workspace/ui/components/ai-elements/node";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { Handle, Position } from "@xyflow/react";
import {
  AlertCircleIcon,
  DownloadIcon,
  PlayIcon,
  Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import type { CanvasNode, CanvasOutput } from "../model/graph";
import { imageExtension } from "../model/image";
import type { connectedInputs } from "../model/inputs";
import { CanvasInputBadges, canvasNodeIcons } from "./canvas-badges";
import { CanvasGifSettings } from "./canvas-gif-settings";
import { type CanvasNextKind, CanvasNextStep } from "./canvas-next-step";
import styles from "./canvas-node.module.css";
import { CanvasResultCount } from "./canvas-result-count";

export interface CanvasNodeData extends Record<string, unknown> {
  active: boolean;
  agentReady: boolean;
  askAgent: () => void;
  asset?: string;
  busy: boolean;
  continueFrom: (kind: CanvasNextKind) => void;
  error?: string;
  inputs: ReturnType<typeof connectedInputs>;
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
  const Icon = canvasNodeIcons[node.kind];
  return (
    <Node
      className={`${styles.node} w-80 shadow-sm ${active ? "ring-2 ring-primary" : ""}`}
      handles={{
        source: ["prompt", "reference"].includes(node.kind),
        target: !["reference", "prompt"].includes(node.kind),
      }}
    >
      {["text", "image", "gif"].includes(node.kind) ? (
        <Handle isConnectable={false} position={Position.Right} type="source" />
      ) : null}
      <NodeHeader>
        <div className="flex items-center gap-2">
          <span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
            <Icon aria-hidden="true" className="size-3.5" />
            {
              {
                text: "生成文本",
                image: "生成图片",
                reference: "图片输入",
                prompt: "提示词",
                output: "输出",
                gif: "合成 GIF",
              }[node.kind]
            }
          </span>
          <Input
            aria-label="节点名称"
            className="nodrag h-7 min-w-0 flex-1 border-0 bg-transparent px-1 font-medium shadow-none"
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
            <AlertDescription className="min-w-0 gap-3">
              <p className="whitespace-pre-wrap break-words">{data.error}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busy || !data.agentReady}
                  onClick={data.askAgent}
                  size="sm"
                  variant="outline"
                >
                  Ask Agent
                </Button>
                {["text", "image", "gif"].includes(node.kind) ? (
                  <Button
                    disabled={busy}
                    onClick={data.run}
                    size="sm"
                    variant="outline"
                  >
                    重试节点
                  </Button>
                ) : null}
              </div>
            </AlertDescription>
          </Alert>
        ) : null}
        <CanvasInputBadges inputs={data.inputs} />
        <NodeInputs data={data} />
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
              download={`${node.label}.${imageExtension(image)}`}
              href={image.startsWith("https:") ? `${image}?download=1` : image}
            >
              <DownloadIcon className="size-3" />
              下载图片
            </a>
          </div>
        ) : null}
      </NodeContent>
      <NodeFooter className="flex items-center justify-end gap-2">
        {active ? (
          <p
            aria-live="polite"
            className="mr-auto animate-pulse text-primary text-sm"
          >
            正在生成…
          </p>
        ) : null}
        {node.kind === "prompt" || asset ? (
          <CanvasNextStep disabled={busy} onSelect={data.continueFrom} />
        ) : null}
        {["text", "image", "gif"].includes(node.kind) ? (
          <Button
            className="nodrag"
            disabled={busy}
            onClick={data.run}
            size="sm"
            variant="outline"
          >
            <PlayIcon className="size-3" />
            {data.runLabel}
          </Button>
        ) : null}
      </NodeFooter>
    </Node>
  );
}

function NodeInputs({ data }: { data: CanvasNodeData }) {
  const { node, asset, busy } = data;
  if (node.kind === "gif") {
    return <CanvasGifSettings data={data} />;
  }
  if (node.kind === "reference") {
    return (
      <label className="nodrag block cursor-pointer border border-dashed p-4 text-center text-muted-foreground text-sm">
        {asset ? "更换图片" : "上传图片"}
        <input
          accept="image/png,image/jpeg,image/webp,image/gif"
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
          PNG、JPEG、WebP、GIF，最大 8 MB
        </span>
      </label>
    );
  }
  return (
    <>
      <Textarea
        aria-label={`${node.label}提示词`}
        className="nodrag nowheel min-h-28 resize-y text-sm"
        disabled={busy}
        onChange={(event) => data.update({ prompt: event.target.value })}
        placeholder={
          node.kind === "prompt"
            ? "输入提示词或其他文本，连接后原样传给下游。"
            : "描述生成要求；上游文本也会全文加入提示词，图片作为参考。"
        }
        value={node.prompt}
      />
      {node.kind === "prompt" ? null : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CanvasResultCount data={data} />
          {node.kind === "image" ? (
            <Select
              disabled={busy}
              onValueChange={(value) => {
                if (value) {
                  data.update({ aspectRatio: value });
                }
              }}
              value={node.aspectRatio}
            >
              <SelectTrigger aria-label="画面比例" className="nodrag" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                className="nodrag nowheel"
              >
                <SelectItem value="auto">自动</SelectItem>
                <SelectItem value="16:9">16:9</SelectItem>
                <SelectItem value="1:1">1:1</SelectItem>
                <SelectItem value="9:16">9:16</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
        </div>
      )}
    </>
  );
}
