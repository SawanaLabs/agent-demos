"use client";
import {
  Node,
  NodeContent,
  NodeHeader,
} from "@workspace/ui/components/ai-elements/node";
import { Button } from "@workspace/ui/components/button";
import Image from "next/image";
import styles from "./canvas-node.module.css";

export interface CanvasResultData extends Record<string, unknown> {
  busy: boolean;
  continueFrom: () => void;
  image: string;
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
        <Image
          alt={`${data.label}生成结果`}
          className="nodrag max-h-80 w-full rounded-sm object-contain"
          height={280}
          src={data.image}
          unoptimized
          width={264}
        />
        <div className="flex items-center justify-between gap-2">
          <a
            className="nodrag text-xs underline"
            download={`${data.label}.png`}
            href={data.image}
          >
            下载图片
          </a>
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
