"use client";
import {
  Node,
  NodeContent,
  NodeFooter,
  NodeHeader,
} from "@workspace/ui/components/ai-elements/node";
import { Button } from "@workspace/ui/components/button";
import { Trash2Icon } from "lucide-react";
import type { CanvasOutput } from "../model/graph";
import { CanvasContent, CanvasDownloads } from "./canvas-content";
import styles from "./canvas-node.module.css";

export interface CanvasDisplayData extends Record<string, unknown> {
  busy: boolean;
  continueFrom?: () => void;
  emptyText?: string;
  items: { id: string; label: string; content: CanvasOutput }[];
  label: string;
  remove?: () => void;
}

export function CanvasOutputView({ data }: { data: CanvasDisplayData }) {
  return (
    <Node
      className={`${styles.node} ${data.continueFrom ? styles.result : ""} w-80 shadow-sm`}
      handles={{
        source: Boolean(data.continueFrom),
        target: true,
      }}
    >
      <NodeHeader>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{data.label}</span>
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
            <Button
              className="nodrag"
              disabled={data.busy}
              onClick={data.continueFrom}
              size="sm"
              variant="outline"
            >
              用于下一步
            </Button>
          ) : null}
        </NodeFooter>
      ) : null}
    </Node>
  );
}
