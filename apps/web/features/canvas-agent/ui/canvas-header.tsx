"use client";
import { Button } from "@workspace/ui/components/button";
import {
  DownloadIcon,
  PlayIcon,
  PlusIcon,
  SlashIcon,
  UploadIcon,
  WorkflowIcon,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import type { useCanvasAgent } from "./use-canvas-agent";
import type { useWorkflowFile } from "./use-workflow-file";

export function CanvasHeader({
  controller: c,
  ready,
  file,
}: {
  controller: ReturnType<typeof useCanvasAgent>;
  ready: boolean;
  file: ReturnType<typeof useWorkflowFile>;
}) {
  const importInput = useRef<HTMLInputElement>(null);
  return (
    <header className="flex min-h-[72px] shrink-0 flex-wrap items-center justify-between gap-y-2 py-3 pr-16">
      <div className="flex min-w-0 items-center">
        <Link
          aria-label="返回 Agent Demos"
          className="flex w-14 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-[72px]"
          href="/"
          onNavigate={(event) => {
            event.preventDefault();
            void file.navigate("/");
          }}
        >
          <WorkflowIcon className="size-7" />
        </Link>
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden font-semibold text-muted-foreground text-sm md:inline">
            Agent Demos
          </span>
          <SlashIcon className="hidden size-4 text-border md:block" />
          <h1 className="truncate font-semibold text-sm tracking-tight sm:text-base">
            Canvas Agent
          </h1>
          <span aria-live="polite" className="text-muted-foreground text-xs">
            {file.dirty ? "未保存" : "临时画布"}
          </span>
        </div>
      </div>
      <div className="ml-14 flex items-center gap-1 sm:ml-3">
        <Button
          aria-label="新建画布"
          disabled={file.busy}
          onClick={file.newCanvas}
          size="sm"
          variant="ghost"
        >
          <PlusIcon className="size-4" />
          <span className="hidden sm:inline">新建</span>
        </Button>
        <Button
          aria-label="打开工作流"
          disabled={file.busy}
          onClick={() => importInput.current?.click()}
          size="sm"
          variant="ghost"
        >
          <UploadIcon className="size-4" />
          <span className="hidden sm:inline">打开</span>
        </Button>
        <Button
          aria-label="保存工作流"
          disabled={file.busy}
          onClick={file.save}
          size="sm"
          variant="ghost"
        >
          <DownloadIcon className="size-4" />
          <span className="hidden sm:inline">保存</span>
        </Button>
        <Button
          disabled={file.busy || !ready || c.graph.nodes.length === 0}
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
          const selected = event.target.files?.[0];
          if (selected) {
            void file.load(selected);
          }
          event.target.value = "";
        }}
        ref={importInput}
        type="file"
      />
    </header>
  );
}
