"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { CanvasNodeData } from "./canvas-node";

export function CanvasResultCount({ data }: { data: CanvasNodeData }) {
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
      <SelectTrigger aria-label="结果数量" className="nodrag" size="sm">
        <SelectValue>{data.node.resultCount ?? 1} 个结果</SelectValue>
      </SelectTrigger>
      <SelectContent
        align="start"
        alignItemWithTrigger={false}
        className="nodrag nowheel"
      >
        {[1, 2, 3, 4].map((count) => (
          <SelectItem key={count} value={String(count)}>
            {count} 个结果
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
