"use client";

import { cn } from "@workspace/ui/lib/utils";
import {
  CheckIcon,
  ChevronDownIcon,
  CircleDashedIcon,
  FileTextIcon,
  GlobeIcon,
  LoaderIcon,
  SearchIcon,
  TerminalIcon,
  WrenchIcon,
  XIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * UxToolChips — compact monochrome chips representing tool calls.
 *
 * Interaction patterns recreated here:
 * - Each chip cycles pending → running → done/error on its own clock.
 * - Clicking a chip expands it inline to show input params and output.
 * - Status icon + label change with the state; errors stay visible.
 * - "Replay" restarts the whole sequence, the way a demo harness would.
 *
 * Local state only — no backend.
 */

export type UxToolStatus = "pending" | "running" | "done" | "error";

export interface UxToolCall {
  /** ms to spend in `running` before resolving */
  durationMs?: number;
  error?: string;
  id: string;
  input: Record<string, string>;
  kind: "search" | "web" | "file" | "terminal" | "tool";
  name: string;
  output?: string;
}

interface UxToolChipsProps {
  autoPlay?: boolean;
  calls?: UxToolCall[];
  className?: string;
}

const defaultCalls: UxToolCall[] = [
  {
    durationMs: 1400,
    id: "call-search",
    input: { query: "agent ui tool call patterns" },
    kind: "search",
    name: "web_search",
    output: "6 results · top hit docs.example.com/tool-calls",
  },
  {
    durationMs: 900,
    id: "call-fetch",
    input: { url: "docs.example.com/tool-calls" },
    kind: "web",
    name: "fetch_url",
    output: "200 OK · 8.4kb markdown",
  },
  {
    durationMs: 1800,
    error: "ENOENT: no such file",
    id: "call-read",
    input: { path: "src/agent/tool-ui.tsx" },
    kind: "file",
    name: "read_file",
  },
  {
    durationMs: 2200,
    id: "call-run",
    input: { cmd: "pnpm typecheck" },
    kind: "terminal",
    name: "run_terminal",
    output: "0 errors · 1.8s",
  },
];

const kindIcons: Record<UxToolCall["kind"], ReactNode> = {
  file: <FileTextIcon className="size-3" />,
  search: <SearchIcon className="size-3" />,
  terminal: <TerminalIcon className="size-3" />,
  tool: <WrenchIcon className="size-3" />,
  web: <GlobeIcon className="size-3" />,
};

const statusLabels: Record<UxToolStatus, string> = {
  done: "done",
  error: "error",
  pending: "queued",
  running: "running",
};

function StatusIcon({ status }: { status: UxToolStatus }) {
  if (status === "done") {
    return <CheckIcon className="size-3" />;
  }
  if (status === "error") {
    return <XIcon className="size-3" />;
  }
  if (status === "running") {
    return <LoaderIcon className="size-3 animate-spin" />;
  }
  return <CircleDashedIcon className="size-3" />;
}

interface ToolChipDetailProps {
  call: UxToolCall;
  status: UxToolStatus;
}

function ToolChipDetail({ call, status }: ToolChipDetailProps) {
  return (
    <div className="mt-1.5 w-full rounded-md border bg-muted/40 p-2.5">
      <dl className="grid gap-1 font-mono text-[11.5px]">
        {Object.entries(call.input).map(([key, value]) => (
          <div className="flex gap-2" key={key}>
            <dt className="text-muted-foreground">{key}:</dt>
            <dd className="truncate">{value}</dd>
          </div>
        ))}
        {status === "done" && call.output ? (
          <div className="mt-1 flex gap-2 border-t pt-1.5">
            <dt className="text-muted-foreground">out:</dt>
            <dd>{call.output}</dd>
          </div>
        ) : null}
        {status === "error" && call.error ? (
          <div className="mt-1 flex gap-2 border-t pt-1.5 text-destructive">
            <dt>err:</dt>
            <dd>{call.error}</dd>
          </div>
        ) : null}
        {status === "running" || status === "pending" ? (
          <div className="mt-1 flex gap-2 border-t pt-1.5 text-muted-foreground">
            <dd>waiting for output…</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

interface ToolChipProps {
  call: UxToolCall;
  expanded: boolean;
  onToggle: () => void;
  status: UxToolStatus;
}

function ToolChip({ call, expanded, onToggle, status }: ToolChipProps) {
  return (
    <div className="contents">
      <button
        aria-expanded={expanded}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11.5px] transition-colors",
          status === "running" && "border-foreground/25",
          status === "error" && "border-destructive/40 text-destructive",
          expanded && "bg-accent"
        )}
        onClick={onToggle}
        type="button"
      >
        {kindIcons[call.kind]}
        {call.name}
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[10.5px]",
            status === "error" ? "text-destructive" : "text-muted-foreground"
          )}
        >
          <StatusIcon status={status} />
          {statusLabels[status]}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-3 text-muted-foreground transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>
      {expanded ? <ToolChipDetail call={call} status={status} /> : null}
    </div>
  );
}

export function UxToolChips({
  calls = defaultCalls,
  autoPlay = true,
  className,
}: UxToolChipsProps) {
  const [statuses, setStatuses] = useState<Record<string, UxToolStatus>>(() =>
    Object.fromEntries(
      calls.map((call) => [call.id, "pending" as UxToolStatus])
    )
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  const runAll = useCallback(() => {
    clearTimers();
    setStatuses(
      Object.fromEntries(
        calls.map((call) => [call.id, "pending" as UxToolStatus])
      )
    );

    let cursor = 300;
    calls.forEach((call) => {
      const runTimer = window.setTimeout(() => {
        setStatuses((current) => ({ ...current, [call.id]: "running" }));
      }, cursor);
      timersRef.current.push(runTimer);
      cursor += call.durationMs ?? 1200;

      const finalTimer = window.setTimeout(() => {
        setStatuses((current) => ({
          ...current,
          [call.id]: call.error ? "error" : "done",
        }));
      }, cursor);
      timersRef.current.push(finalTimer);
      cursor += 250;
    });
  }, [calls, clearTimers]);

  useEffect(() => {
    if (autoPlay) {
      runAll();
    }
    return clearTimers;
  }, [autoPlay, runAll, clearTimers]);

  return (
    <div className={cn("rounded-lg border bg-background p-3.5", className)}>
      <div className="flex flex-wrap gap-1.5">
        {calls.map((call) => {
          const status = statuses[call.id] ?? "pending";
          const expanded = expandedId === call.id;
          return (
            <ToolChip
              call={call}
              expanded={expanded}
              key={call.id}
              onToggle={() =>
                setExpandedId((current) =>
                  current === call.id ? null : call.id
                )
              }
              status={status}
            />
          );
        })}
      </div>
      <div className="mt-3 flex justify-end border-t pt-2.5">
        <button
          className="text-[11.5px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          onClick={runAll}
          type="button"
        >
          Replay sequence
        </button>
      </div>
    </div>
  );
}
