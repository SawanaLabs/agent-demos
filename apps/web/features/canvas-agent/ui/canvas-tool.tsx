"use client";

import {
  Tool,
  ToolContent,
  type ToolPart,
} from "@workspace/ui/components/ai-elements/tool";
import { CollapsibleTrigger } from "@workspace/ui/components/collapsible";
import { getToolName } from "ai";
import {
  ChevronRightIcon,
  LayoutGridIcon,
  LinkIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UnlinkIcon,
  WrenchIcon,
} from "lucide-react";

const actions = {
  addNode: { label: "添加并连接节点", icon: PlusIcon },
  removeNodes: { label: "删除节点", icon: TrashIcon },
  updateNode: { label: "修改节点", icon: PencilIcon },
  connectNodes: { label: "连接节点", icon: LinkIcon },
  disconnectNodes: { label: "断开连接", icon: UnlinkIcon },
  runWorkflow: { label: "执行工作流", icon: PlayIcon },
  readWorkflow: { label: "读取工作流", icon: SearchIcon },
  arrangeCanvas: { label: "整理画布", icon: LayoutGridIcon },
};

const statuses: Record<ToolPart["state"], string> = {
  "input-streaming": "准备中",
  "input-available": "执行中",
  "output-available": "已完成",
  "output-error": "失败",
  "output-denied": "已拒绝",
  "approval-requested": "等待批准",
  "approval-responded": "已回应",
};

export function CanvasTool({
  part,
  streaming,
}: {
  part: ToolPart;
  streaming: boolean;
}) {
  const name = getToolName(part);
  const action = actions[name as keyof typeof actions] ?? {
    label: "操作工作流",
    icon: WrenchIcon,
  };
  const output =
    "output" in part && part.output && typeof part.output === "object"
      ? (part.output as Record<string, unknown>)
      : undefined;
  const pending = ["input-streaming", "input-available"].includes(part.state);
  const interrupted = pending && !streaming;
  const error =
    part.state === "output-error"
      ? part.errorText
      : typeof output?.error === "string" && output.error;
  let status = statuses[part.state];
  if (interrupted) {
    status = "已中断";
  }
  if (error) {
    status = "失败";
  }
  const Icon = pending && streaming ? LoaderCircleIcon : action.icon;
  const summary =
    typeof output?.summary === "string"
      ? output.summary
      : "操作已完成，画布已同步。";

  return (
    <Tool className="mb-0 border-0">
      <CollapsibleTrigger className="group/tool flex max-w-full items-center gap-1.5 rounded-sm py-1 text-left text-muted-foreground text-xs outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
        <Icon
          aria-hidden="true"
          className={
            pending && streaming
              ? "size-3.5 shrink-0 animate-spin"
              : "size-3.5 shrink-0"
          }
        />
        <span>{action.label}</span>
        <span className={error ? "text-destructive" : "text-muted-foreground"}>
          · {status}
        </span>
        <ChevronRightIcon
          aria-hidden="true"
          className="size-3 shrink-0 transition-transform group-aria-expanded/tool:rotate-90"
        />
      </CollapsibleTrigger>
      {error && (
        <p
          className="break-words py-1 pl-5 text-destructive text-xs"
          role="alert"
        >
          {error}
        </p>
      )}
      {interrupted && !error && (
        <p className="pl-5 text-muted-foreground text-xs">
          操作已中断，可以继续完成。
        </p>
      )}
      <ToolContent className="space-y-0 px-0 py-1 pl-5 text-muted-foreground text-xs">
        {part.state === "output-available" && !error ? summary : status}
      </ToolContent>
    </Tool>
  );
}
