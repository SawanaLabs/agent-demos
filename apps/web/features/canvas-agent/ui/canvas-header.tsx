"use client";
import { Button } from "@workspace/ui/components/button";
import {
  ArrowLeftIcon,
  DownloadIcon,
  PlayIcon,
  PlusIcon,
  UploadIcon,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { parseGraph } from "../model/graph";
import type { useCanvasAgent } from "./use-canvas-agent";

export function CanvasHeader({
  controller: c,
  ready,
}: {
  controller: ReturnType<typeof useCanvasAgent>;
  ready: boolean;
}) {
  const importInput = useRef<HTMLInputElement>(null);
  function save() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(c.graph)], { type: "application/json" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "canvas-workflow.json";
    link.click();
    URL.revokeObjectURL(url);
  }
  async function load(file: File) {
    try {
      if (file.size > 32 * 1024 * 1024) {
        throw new Error("文件过大。");
      }
      c.setGraph(parseGraph(JSON.parse(await file.text())));
      c.setError(null);
    } catch {
      c.setError("无法打开工作流，请选择从此画布导出的 JSON 文件。");
    }
  }
  return (
    <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-background px-4 py-3 pr-16">
      <div className="flex items-center gap-3">
        <Link aria-label="返回 Agent Demos" href="/">
          <ArrowLeftIcon className="size-4" />
        </Link>
        <h1 className="font-semibold text-base">Canvas Agent</h1>
        <span className="hidden text-muted-foreground text-xs sm:inline">
          编排工作流，再生成内容
        </span>
      </div>
      <div className="flex items-center gap-1">
        <Button
          aria-label="新建画布"
          disabled={c.busy}
          onClick={c.newCanvas}
          size="sm"
          variant="ghost"
        >
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">新建</span>
        </Button>
        <Button
          aria-label="打开工作流"
          disabled={c.busy}
          onClick={() => importInput.current?.click()}
          size="sm"
          variant="ghost"
        >
          <UploadIcon className="size-4" />
          <span className="hidden sm:inline">打开</span>
        </Button>
        <Button
          aria-label="保存工作流"
          onClick={save}
          size="sm"
          variant="ghost"
        >
          <DownloadIcon className="size-4" />
          <span className="hidden sm:inline">保存</span>
        </Button>
        <Button
          disabled={c.busy || !ready || c.graph.nodes.length === 0}
          onClick={() => c.run()}
          size="sm"
        >
          <PlayIcon className="size-4" />
          {c.busy ? "运行中" : "运行工作流"}
        </Button>
      </div>
      <input
        accept="application/json"
        aria-label="打开工作流文件"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void load(file);
          }
          event.target.value = "";
        }}
        ref={importInput}
        type="file"
      />
    </header>
  );
}
