"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon, Link2Icon, MessageSquareIcon } from "lucide-react";
import { useState } from "react";

/**
 * UxSelectionActions — a floating action bar revealed on row hover.
 *
 * Interaction patterns recreated here:
 * - Hovering (or keyboard-focusing) a row floats a pill action bar on
 *   its trailing edge: link copy, comment, and an overflow menu.
 * - Copy flashes a check confirmation in place; comment expands an
 *   inline input beneath the row; overflow opens a dropdown menu.
 * - The bar fades/slides in rather than popping — it belongs to the row.
 *
 * Local state only — no backend.
 */

interface Row {
  id: string;
  meta: string;
  title: string;
}

const ROWS: Row[] = [
  { id: "q4", meta: "Updated 2h ago · 12 rows", title: "Q4 velocity table" },
  { id: "sop", meta: "Shared by Rin · PDF", title: "Dairy Onboarding SOP" },
  {
    id: "reorder",
    meta: "Draft · 3 suppliers",
    title: "Pistachio reorder plan",
  },
];

function ActionBar({
  copied,
  commentOpen,
  onCopy,
  onToggleComment,
}: {
  commentOpen: boolean;
  copied: boolean;
  onCopy: () => void;
  onToggleComment: () => void;
}) {
  const buttonClass =
    "grid size-6 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";
  return (
    <span className="pointer-events-none absolute top-1/2 right-2 z-10 flex -translate-y-1/2 items-center gap-0.5 rounded-full border bg-popover p-1 opacity-0 shadow-md transition-[opacity,transform] duration-200 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100">
      <button
        aria-label={copied ? "Link copied" : "Copy link"}
        className={cn(buttonClass, copied && "text-status-success-600")}
        onClick={onCopy}
        type="button"
      >
        {copied ? (
          <CheckIcon className="size-3.5" />
        ) : (
          <Link2Icon className="size-3.5" />
        )}
      </button>
      <button
        aria-label="Comment"
        aria-pressed={commentOpen}
        className={cn(buttonClass, commentOpen && "bg-muted text-foreground")}
        onClick={onToggleComment}
        type="button"
      >
        <MessageSquareIcon className="size-3.5" />
      </button>
      <span className="mx-0.5 h-4 w-px bg-border" />
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="More actions"
          className={buttonClass}
        />
        <DropdownMenuContent align="end" side="top">
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}

function ActionRow({ row }: { row: Row }) {
  const [copied, setCopied] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [comment, setComment] = useState("");

  const copy = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative rounded-lg transition-colors hover:bg-muted/50">
      <div className="flex h-12 items-center gap-2.5 px-2.5 pr-28">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-[13px] text-foreground">
            {row.title}
          </p>
          <p className="truncate text-[11.5px] text-muted-foreground">
            {row.meta}
          </p>
        </div>
      </div>
      <ActionBar
        commentOpen={commentOpen}
        copied={copied}
        onCopy={copy}
        onToggleComment={() => setCommentOpen((value) => !value)}
      />
      <div
        className="grid transition-[grid-template-rows,opacity] duration-200"
        style={{
          gridTemplateRows: commentOpen ? "1fr" : "0fr",
          opacity: commentOpen ? 1 : 0,
        }}
      >
        <div className="overflow-hidden">
          <div className="flex items-center gap-2 px-2.5 pb-2">
            <input
              aria-label={`Comment on ${row.title}`}
              className="h-7 min-w-0 flex-1 rounded-md border bg-muted/40 px-2 text-[12px] text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-foreground/25"
              onChange={(event) => setComment(event.target.value)}
              placeholder="Add a comment…"
              value={comment}
            />
            <span className="shrink-0 text-[11px] text-muted-foreground">
              ⏎ to send
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UxSelectionActions({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-full max-w-sm rounded-xl border bg-card p-1.5",
        className
      )}
    >
      {ROWS.map((row) => (
        <ActionRow key={row.id} row={row} />
      ))}
    </div>
  );
}
