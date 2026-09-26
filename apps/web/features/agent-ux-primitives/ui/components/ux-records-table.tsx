"use client";

import { Checkbox } from "@workspace/ui/components/checkbox";
import { cn } from "@workspace/ui/lib/utils";
import { HeartIcon, LinkIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  compareRows,
  ROWS,
  type SortKey,
  STRENGTH,
} from "./ux-records-table-data";
import { HeaderCell, WebsiteLink } from "./ux-records-table-parts";

/**
 * UxRecordsTable — a compact CRM grid for agent-curated records.
 *
 * Interaction patterns recreated here:
 * - Header checkbox selects all visible rows (indeterminate when some
 *   are picked); row checkboxes select individually and tint the row.
 * - Sortable headers carry an arrow that flips direction on re-click.
 * - Connection strength renders as a status dot + label; websites render
 *   as real links.
 * - A footer row shows the record count and a "New property" action.
 *
 * Local state only — sorting and selection run on the client. Row data
 * lives in `./ux-records-table-data.ts`; cell renderers in
 * `./ux-records-table-parts.tsx`.
 */

export function UxRecordsTable({ className }: { className?: string }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{ dir: 1 | -1; key: SortKey }>({
    dir: 1,
    key: "name",
  });

  const rows = useMemo(
    () => [...ROWS].sort((a, b) => compareRows(a, b, sort.key) * sort.dir),
    [sort]
  );

  const allSelected = rows.every((row) => selected.has(row.id));
  const partiallySelected =
    !allSelected && rows.some((row) => selected.has(row.id));

  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { dir: (current.dir * -1) as 1 | -1, key }
        : { dir: 1, key }
    );
  const toggleRow = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(rows.map((row) => row.id)));

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full min-w-[480px] border-collapse text-left">
        <thead>
          <tr>
            <th className="border-b px-2.5 py-2 font-medium text-[12px] text-muted-foreground">
              <span className="flex items-center gap-2">
                <Checkbox
                  aria-label="Select all companies"
                  checked={allSelected}
                  indeterminate={partiallySelected}
                  onCheckedChange={toggleAll}
                />
                Company
              </span>
            </th>
            <HeaderCell
              icon={<LinkIcon className="size-3" />}
              label="Last interaction"
              onSort={() => toggleSort("last")}
              sorted={sort.key === "last" ? sort.dir : 0}
            />
            <HeaderCell
              icon={<HeartIcon className="size-3" />}
              label="Connection"
              onSort={() => toggleSort("strength")}
              sorted={sort.key === "strength" ? sort.dir : 0}
            />
            <HeaderCell label="Website" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isSelected = selected.has(row.id);
            const strength = STRENGTH[row.strength];
            return (
              <tr
                className={cn(
                  "transition-colors hover:bg-muted/40",
                  isSelected && "bg-muted/50"
                )}
                key={row.id}
              >
                <td className="border-b px-2.5 py-2">
                  <span className="flex items-center gap-2">
                    <Checkbox
                      aria-label={`Select ${row.name}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleRow(row.id)}
                    />
                    <span className="grid size-5 shrink-0 place-items-center rounded-md bg-muted font-semibold text-[10px] text-muted-foreground">
                      {row.name.slice(0, 1)}
                    </span>
                    <span className="truncate font-medium text-[12.5px] text-foreground">
                      {row.name}
                    </span>
                  </span>
                </td>
                <td
                  className={cn(
                    "border-b px-2.5 py-2 text-[12px] tabular-nums",
                    row.strength === "none"
                      ? "text-muted-foreground/60"
                      : "text-muted-foreground"
                  )}
                >
                  {row.lastLabel}
                </td>
                <td className="border-b px-2.5 py-2">
                  <span className="flex items-center gap-1.5 text-[12px] text-foreground">
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        strength.dotClass
                      )}
                    />
                    {strength.label}
                  </span>
                </td>
                <td className="border-b px-2.5 py-2">
                  <WebsiteLink website={row.website} />
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <td className="px-2.5 py-2 text-[12px] text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">
                {rows.length}
              </span>{" "}
              count
            </td>
            <td className="px-2.5 py-2" colSpan={3}>
              <button
                className="inline-flex items-center gap-1 rounded-md border bg-card px-2 py-1 font-medium text-[11.5px] text-foreground transition-colors hover:bg-muted"
                type="button"
              >
                <PlusIcon className="size-3" />
                New property
              </button>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
