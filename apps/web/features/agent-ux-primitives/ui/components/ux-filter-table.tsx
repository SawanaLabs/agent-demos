"use client";

import { cn } from "@workspace/ui/lib/utils";
import { SearchIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { ROWS, STATUS_META, type TaskRow } from "./ux-filter-table-data";

/**
 * UxFilterTable — a task table driven by a query field + status chips.
 *
 * Interaction patterns recreated here:
 * - Status chips filter rows; each chip carries a status dot and a live
 *   count in tabular figures.
 * - The filter input narrows rows by task or owner text; both predicates
 *   compose, and clearing restores the full list.
 * - Hidden rows collapse via an animated grid-rows transition instead of
 *   popping out of the layout.
 *
 * Local state only — filtering happens in render. Row data lives in
 * `./ux-filter-table-data.ts`.
 */

export function UxFilterTable({ className }: { className?: string }) {
  const [status, setStatus] = useState<"all" | TaskRow["status"]>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const tally = { all: ROWS.length, done: 0, progress: 0, todo: 0 };
    for (const row of ROWS) {
      tally[row.status] += 1;
    }
    return tally;
  }, []);

  const needle = query.trim().toLowerCase();
  const shown = (row: TaskRow) =>
    (status === "all" || row.status === status) &&
    (needle.length === 0 ||
      `${row.task} ${row.owner}`.toLowerCase().includes(needle));

  const chips = [
    { key: "all", label: "All" },
    {
      dotClass: STATUS_META.todo.dotClass,
      key: "todo",
      label: "To do",
    },
    {
      dotClass: STATUS_META.progress.dotClass,
      key: "progress",
      label: "In Progress",
    },
    {
      dotClass: STATUS_META.done.dotClass,
      key: "done",
      label: "Completed",
    },
  ] as const;

  return (
    <div className={cn("w-full max-w-md", className)}>
      <div className="mb-2 flex h-8 items-center gap-2 rounded-md border bg-muted/40 px-2.5">
        <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          aria-label="Filter tasks"
          className="min-w-0 flex-1 bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by task or advisor…"
          value={query}
        />
        {query ? (
          <button
            aria-label="Clear filter"
            className="grid size-5 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setQuery("")}
            type="button"
          >
            <XIcon className="size-3" />
          </button>
        ) : null}
      </div>

      <div className="mb-1 flex items-center gap-1 overflow-x-auto px-0.5 py-1">
        {chips.map((chip) => {
          const isActive = status === chip.key;
          return (
            <button
              aria-pressed={isActive}
              className={cn(
                "flex h-[26px] shrink-0 items-center gap-1.5 rounded-full px-2.5 font-medium text-[12px] transition-colors",
                isActive
                  ? "border bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              )}
              key={chip.key}
              onClick={() => setStatus(chip.key)}
              type="button"
            >
              {"dotClass" in chip ? (
                <span className={cn("size-1.5 rounded-full", chip.dotClass)} />
              ) : null}
              {chip.label}
              <span
                className={cn(
                  "rounded px-1 text-[10.5px] tabular-nums",
                  isActive
                    ? "bg-muted text-muted-foreground"
                    : "text-muted-foreground/70"
                )}
              >
                {counts[chip.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="grid grid-cols-[1.3fr_0.6fr_0.95fr_0.9fr] border-b px-3 py-2 font-medium text-[11.5px] text-muted-foreground">
          <span>Task name</span>
          <span>Date</span>
          <span>Status</span>
          <span>Advisor</span>
        </div>
        {ROWS.map((row) => {
          const visible = shown(row);
          const meta = STATUS_META[row.status];
          return (
            <div
              className="grid transition-[grid-template-rows,opacity] duration-300"
              key={row.task}
              style={{
                gridTemplateRows: visible ? "1fr" : "0fr",
                opacity: visible ? 1 : 0,
              }}
            >
              <div className="overflow-hidden">
                <div className="grid grid-cols-[1.3fr_0.6fr_0.95fr_0.9fr] items-center border-b px-3 py-2 text-[12px] transition-colors last:border-0 hover:bg-muted/40">
                  <span className="truncate font-medium text-foreground">
                    {row.task}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {row.date}
                  </span>
                  <span>
                    <span
                      className={cn(
                        "inline-flex h-5 items-center rounded px-1.5 font-medium text-[11px]",
                        meta.pillClass
                      )}
                    >
                      {meta.label}
                    </span>
                  </span>
                  <span className="truncate text-muted-foreground">
                    {row.owner}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
