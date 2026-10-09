"use client";

import { cn } from "@workspace/ui/lib/utils";
import { RotateCcwIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ADDED_ROW, ROWS, STAGE_MS } from "./ux-diff-table-data";

/**
 * UxDiffTable — a table where the agent's proposed edit plays once.
 *
 * Interaction patterns recreated here:
 * - The run highlights the doomed rows in a red tint first, then settles
 *   into the completed diff: strikethrough text, faded pills, red cells.
 * - A final beat slides an added row in on a green tint — the table ends
 *   resting on the finished diff, not the animation.
 * - Replay re-runs the sequence; hover still works on the resting rows.
 *
 * Driven by a staged timeout chain — no backend. Row data lives in
 * `./ux-diff-table-data.ts`.
 */

function CategoryPill({
  dotClass,
  label,
  struck,
}: {
  dotClass: string;
  label: string;
  struck?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-full border bg-muted/60 px-2 font-medium text-[11.5px] transition-opacity duration-300",
        struck && "opacity-55"
      )}
    >
      <span className={cn("size-1.5 rounded-full", dotClass)} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}

export function UxDiffTable({ className }: { className?: string }) {
  const [stage, setStage] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (stage > STAGE_MS.length) {
      return;
    }
    timerRef.current = window.setTimeout(
      () => setStage((s) => s + 1),
      STAGE_MS[Math.min(stage, STAGE_MS.length - 1)]
    );
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [stage]);

  const replay = useCallback(() => {
    setStage(0);
  }, []);

  // stage 0: plain · stage 1: red flash · stage 2: removal applied ·
  // stage 3: added row revealed
  const flashed = stage === 1;
  const removed = stage >= 2;
  const added = stage >= 3;

  return (
    <div className={cn("w-full max-w-sm", className)}>
      <div className="relative overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="font-medium text-[12.5px] text-foreground">
            Proposed menu cleanup
          </span>
          <button
            aria-label="Replay diff"
            className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={replay}
            type="button"
          >
            <RotateCcwIcon className="size-3.5" />
          </button>
        </div>

        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b">
              {["Flavor", "Category", "Supplier"].map((heading) => (
                <th
                  className="px-3 py-2 font-medium text-[12px] text-muted-foreground"
                  key={heading}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const struck = row.removed && removed;
              const tinted = row.removed && (flashed || removed);
              return (
                <tr
                  className={cn(
                    "border-b transition-colors duration-300 last:border-0 hover:bg-muted/40",
                    tinted && "bg-status-danger-500/10"
                  )}
                  key={row.title}
                >
                  <td
                    className={cn(
                      "px-3 py-2 font-medium text-[13px] tabular-nums transition-colors duration-300",
                      struck
                        ? "text-status-danger-600 dark:text-status-danger-300"
                        : "text-foreground"
                    )}
                  >
                    {row.title}
                  </td>
                  <td className="px-3 py-2">
                    <CategoryPill
                      dotClass={row.dotClass}
                      label={row.category}
                      struck={struck}
                    />
                  </td>
                  <td
                    className={cn(
                      "px-3 py-2 text-[12.5px] transition-colors duration-300",
                      struck
                        ? "text-status-danger-600 line-through decoration-status-danger-500/50 dark:text-status-danger-300"
                        : "text-muted-foreground"
                    )}
                  >
                    {row.supplier}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td className="p-0" colSpan={3}>
                <div
                  className="grid transition-[grid-template-rows,opacity] duration-300"
                  style={{
                    gridTemplateRows: added ? "1fr" : "0fr",
                    opacity: added ? 1 : 0,
                  }}
                >
                  <div className="overflow-hidden bg-status-success-500/10">
                    <div className="grid grid-cols-[34%_30%_36%] items-center border-t">
                      <span className="px-3 py-2 font-medium text-[13px] text-status-success-600 tabular-nums dark:text-status-success-300">
                        {ADDED_ROW.title}
                      </span>
                      <span className="px-3 py-2">
                        <span className="inline-flex h-[22px] items-center gap-1.5 rounded-full border bg-card px-2 font-medium text-[11.5px]">
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              ADDED_ROW.dotClass
                            )}
                          />
                          <span className="text-muted-foreground">
                            {ADDED_ROW.category}
                          </span>
                        </span>
                      </span>
                      <span className="px-3 py-2 text-[13px] text-status-success-600 dark:text-status-success-300">
                        {ADDED_ROW.supplier}
                      </span>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
