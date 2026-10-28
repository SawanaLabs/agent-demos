"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { PageText, usePageCopy } from "@/components/page-copy";
import type { CanvasNodeData } from "./canvas-node";

export function CanvasResultCount({ data }: { data: CanvasNodeData }) {
  const pageCopy = usePageCopy();

  return (
    <Select
      disabled={data.busy}
      onValueChange={(value) => {
        if (value) {
          data.update({ resultCount: Number(value) });
        }
      }}
      value={String(data.node.resultCount ?? 1)}
    >
      <SelectTrigger
        aria-label={pageCopy("结果数量")}
        className="nodrag"
        size="sm"
      >
        <SelectValue>
          {data.node.resultCount ?? 1}
          <PageText>{" 个结果"}</PageText>
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        className="nodrag nowheel"
      >
        {[1, 2, 3, 4].map((count) => (
          <SelectItem key={count} value={String(count)}>
            {count}
            <PageText>{" 个结果"}</PageText>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
