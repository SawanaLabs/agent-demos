"use client";
import {
  Node,
  NodeContent,
  NodeHeader,
} from "@workspace/ui/components/ai-elements/node";
import { Button } from "@workspace/ui/components/button";
import type { CanvasOutput } from "../model/graph";
import { CanvasContent } from "./canvas-content";
import styles from "./canvas-node.module.css";

export interface CanvasResultData extends Record<string, unknown> {
  busy: boolean;
  content: CanvasOutput;
  continueFrom: () => void;
  label: string;
}

export function CanvasResultView({ data }: { data: CanvasResultData }) {
  return (
    <Node
      className={`${styles.node} ${styles.result} w-72 shadow-sm`}
      handles={{ source: true, target: true }}
    >
      <NodeHeader>
        <p className="font-medium text-sm">{data.label} · 生成结果</p>
      </NodeHeader>
      <NodeContent className="space-y-3">
        <CanvasContent content={data.content} label={data.label} />
        <div className="flex justify-end">
          <Button
            className="nodrag"
            disabled={data.busy}
            onClick={data.continueFrom}
            size="sm"
            variant="outline"
          >
            用于下一步
          </Button>
        </div>
      </NodeContent>
    </Node>
  );
}
