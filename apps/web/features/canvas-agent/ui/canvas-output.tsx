"use client";
import {
  Node,
  NodeContent,
  NodeFooter,
  NodeHeader,
} from "@workspace/ui/components/ai-elements/node";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { MonitorIcon, Trash2Icon } from "lucide-react";
import type { CanvasOutput } from "../model/graph";
import type { CanvasContentType } from "../model/inputs";
import { CanvasTypeBadge } from "./canvas-badges";
import { CanvasContent, CanvasDownloads } from "./canvas-content";
import { type CanvasNextKind, CanvasNextStep } from "./canvas-next-step";
import styles from "./canvas-node.module.css";

export interface CanvasDisplayData extends Record<string, unknown> {
  busy: boolean;
  continueFrom?: (kind: CanvasNextKind) => void;
  emptyText?: string;
  items: { id: string; label: string; content: CanvasOutput }[];
  label: string;
  remove?: () => void;
  rename: (label: string) => void;
  types: CanvasContentType[];
}

export function CanvasOutputView({ data }: { data: CanvasDisplayData }) {
  const types = [
    ...new Set(
      data.items.length
        ? data.items.flatMap(({ content }) => [
            ...(content.text ? ["text" as const] : []),
            ...(content.image ? ["image" as const] : []),
          ])
        : data.types
    ),
  ];
  return (
    <Node
      className={`${styles.node} ${data.continueFrom ? styles.result : ""} w-80 shadow-sm`}
      handles={{
        source: Boolean(data.continueFrom),
        target: true,
      }}
    >
      <NodeHeader>
        <div className="flex items-center gap-2">
          <MonitorIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-muted-foreground"
          />
          <Input
            aria-label="预览输出名称"
            className="nodrag h-7 min-w-0 flex-1 border-0 bg-transparent px-1 font-medium shadow-none"
            defaultValue={data.label}
            disabled={data.busy}
            key={data.label}
            maxLength={100}
            onBlur={(event) => {
              const label = event.target.value.trim() || "预览输出";
              event.target.value = label;
              if (label !== data.label) {
                data.rename(label);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                event.currentTarget.blur();
              }
            }}
          />
          <div className="flex shrink-0 gap-1">
            {types.map((type) => (
              <CanvasTypeBadge key={type} type={type} />
            ))}
          </div>
          {data.remove ? (
            <Button
              aria-label={`删除${data.label}`}
              className="nodrag"
              disabled={data.busy}
              onClick={data.remove}
              size="icon-sm"
              variant="ghost"
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          ) : null}
        </div>
      </NodeHeader>
      <NodeContent className="space-y-3">
        {data.items.length ? (
          data.items.map(({ id, label, content }) => (
            <section className="space-y-2 border-b pb-3 last:border-0" key={id}>
              <p className="text-muted-foreground text-xs">{label}</p>
              <CanvasContent content={content} label={label} />
            </section>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">
            {data.emptyText ??
              "把文本或图片连到左侧圆点，在这里集中查看。无需单独运行。"}
          </p>
        )}
      </NodeContent>
      {data.items.some(({ content }) => content.image || content.text) ||
      data.continueFrom ? (
        <NodeFooter className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap gap-2">
            {data.items.map(({ id, label, content }) => (
              <div className="flex min-w-0 flex-wrap gap-2" key={id}>
                {data.items.length > 1 ? (
                  <span className="w-full truncate text-muted-foreground text-xs">
                    {label}
                  </span>
                ) : null}
                <CanvasDownloads content={content} label={label} />
              </div>
            ))}
          </div>
          {data.continueFrom ? (
            <CanvasNextStep disabled={data.busy} onSelect={data.continueFrom} />
          ) : null}
        </NodeFooter>
      ) : null}
    </Node>
  );
}
