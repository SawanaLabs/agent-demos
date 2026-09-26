"use client";

import { cn } from "@workspace/ui/lib/utils";
import { SearchIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

/**
 * UxSearch — command-style search with live filtering.
 *
 * Interaction patterns recreated here:
 * - Typing filters a fixed list; the matched substring is highlighted in
 *   each result row, mirroring palette-style search.
 * - A clear affordance fades in once the field has text; picking a row
 *   fills the field with that result.
 * - An empty state replaces the list when nothing matches.
 *
 * Local state only — filtering happens in render.
 */

const ITEMS = [
  "Forecast summer demand",
  "Find waffle cone suppliers",
  "Compare seasonal flavors",
  "Draft flavor launch plan",
  "Check cold-chain status",
  "Audit sugar costs",
  "Retire low sellers",
];

function highlightMatch(text: string, query: string): ReactNode {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return text;
  }
  const index = text.toLowerCase().indexOf(needle);
  if (index === -1) {
    return text;
  }
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-[3px] bg-status-warning-500/25 px-0.5 text-inherit">
        {text.slice(index, index + needle.length)}
      </mark>
      {text.slice(index + needle.length)}
    </>
  );
}

export function UxSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState("");

  const results = query
    ? ITEMS.filter((item) =>
        item.toLowerCase().includes(query.trim().toLowerCase())
      )
    : ITEMS.slice(0, 5);
  const empty = query.trim().length > 0 && results.length === 0;

  return (
    <div className={cn("flex w-full max-w-72 flex-col", className)}>
      <div className="w-full self-start overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex h-10 items-center gap-2 border-b px-3 transition-colors hover:bg-muted/40">
          <SearchIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <input
            aria-label="Search flavors"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search flavors…"
            value={query}
          />
          {query ? (
            <button
              aria-label="Clear search"
              className="grid size-[22px] place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setQuery("")}
              type="button"
            >
              <XIcon className="size-3" />
            </button>
          ) : null}
        </div>

        {empty ? (
          <div className="flex flex-col items-center justify-center gap-1 px-4 py-8">
            <span className="mb-1.5 grid size-8 place-items-center rounded-md border bg-muted text-muted-foreground">
              <SearchIcon className="size-3.5" />
            </span>
            <span className="font-medium text-[13px] text-foreground">
              No results found
            </span>
            <span className="text-[12px] text-muted-foreground">
              Adjust your search to try again
            </span>
          </div>
        ) : (
          <div className="p-1">
            {results.map((item) => (
              <button
                className="flex h-8 w-full items-center rounded-md px-2 text-left text-[13px] text-foreground transition-colors hover:bg-muted"
                key={item}
                onClick={() => setQuery(item)}
                type="button"
              >
                <span className="truncate">{highlightMatch(item, query)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
