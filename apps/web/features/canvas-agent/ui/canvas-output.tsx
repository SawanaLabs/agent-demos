"use client";
import {
  Node,
  NodeContent,
  NodeHeader,
} from "@workspace/ui/components/ai-elements/node";
import { Button } from "@workspace/ui/components/button";
import { Trash2Icon } from "lucide-react";
import type { CanvasOutput } from "../model/graph";
import { CanvasContent } from "./canvas-content";
import styles from "./canvas-node.module.css";

export interface CanvasDisplayData extends Record<string, unknown> {
  busy: boolean;
  items: { id: string; label: string; content: CanvasOutput }[];
  label: string;
  remove: () => void;
}

export function CanvasOutputView({ data }: { data: CanvasDisplayData }) {
  return (
    <Node
      className={`${styles.node} w-80 shadow-sm`}
      handles={{ source: false, target: true }}
    >
      <NodeHeader>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{data.label}</span>
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
            把文本或图片连到左侧圆点，在这里集中查看。无需单独运行。
          </p>
        )}
      </NodeContent>
    </Node>
  );
}
