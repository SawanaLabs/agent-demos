"use client";
import { Button } from "@workspace/ui/components/button";
import {
  FileTextIcon,
  ImageIcon,
  MonitorIcon,
  SparklesIcon,
} from "lucide-react";
import type { CanvasNode } from "../model/graph";

const entries = [
  { kind: "image", label: "生成图片", icon: SparklesIcon },
  { kind: "text", label: "生成文本", icon: SparklesIcon },
  { kind: "reference", label: "图片素材", icon: ImageIcon },
  { kind: "prompt", label: "文本素材", icon: FileTextIcon },
  { kind: "output", label: "输出", icon: MonitorIcon },
] as const;

export function CanvasToolbar({
  busy,
  add,
}: {
  busy: boolean;
  add: (kind: CanvasNode["kind"]) => void;
}) {
  return (
    <div className="absolute top-3 left-16 flex max-w-[calc(100%-5rem)] flex-wrap gap-1 rounded-lg border bg-background p-1 shadow-sm">
      {entries.map(({ kind, label, icon: Icon }) => (
        <Button
          disabled={busy}
          key={kind}
          onClick={() => add(kind)}
          size="sm"
          variant="ghost"
        >
          <Icon className="size-4" />
          {label}
        </Button>
      ))}
    </div>
  );
}
