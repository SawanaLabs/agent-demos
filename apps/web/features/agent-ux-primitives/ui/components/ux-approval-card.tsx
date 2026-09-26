"use client";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon, CircleHelpIcon, PencilLineIcon, XIcon } from "lucide-react";
import { useState } from "react";

/**
 * UxApprovalCard — a card where the agent asks for a decision.
 *
 * Interaction patterns recreated here:
 * - The agent asks a yes/no question with a reason and a preview of the
 *   action it wants to take.
 * - Approve resolves the card with a check state; Reject resolves with
 *   an X; "Edit request" opens an inline textarea so the user can amend
 *   the instruction before approving — mirroring the approve/edit/deny
 *   tri-state of agent approval UIs.
 * - Once resolved, the card collapses into a compact summary row with
 *   the chosen verdict and a reset affordance.
 *
 * Local state only — no backend.
 */

export type UxApprovalVerdict = "approved" | "rejected" | "edited";

interface UxApprovalCardProps {
  actionLabel?: string;
  actionPreview?: string;
  className?: string;
  onResolve?: (verdict: UxApprovalVerdict, amendedText?: string) => void;
  question?: string;
  reason?: string;
}

export function UxApprovalCard({
  question = "Run `rm -rf dist && pnpm build` before continuing?",
  reason = "The last build left stale chunks that will confuse the demo. I want a clean production build before I wire the new prompt bar.",
  actionLabel = "shell command",
  actionPreview = "rm -rf dist .next && pnpm build",
  onResolve,
  className,
}: UxApprovalCardProps) {
  const [verdict, setVerdict] = useState<UxApprovalVerdict | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [amended, setAmended] = useState(actionPreview);

  const resolve = (next: UxApprovalVerdict) => {
    setVerdict(next);
    setIsEditing(false);
    onResolve?.(next, next === "edited" ? amended : undefined);
  };

  const reset = () => {
    setVerdict(null);
    setIsEditing(false);
    setAmended(actionPreview);
  };

  if (verdict) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-[12.5px]",
          className
        )}
      >
        {verdict === "approved" || verdict === "edited" ? (
          <CheckIcon className="size-3.5 text-status-success-500" />
        ) : (
          <XIcon className="size-3.5 text-destructive" />
        )}
        <span className="flex-1 truncate">
          {verdict === "approved" && "Approved — running the command."}
          {verdict === "rejected" && "Rejected — I will ask before retrying."}
          {verdict === "edited" && `Edited — running: ${amended}`}
        </span>
        <button
          className="text-[11.5px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          onClick={reset}
          type="button"
        >
          Reset
        </button>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border bg-background", className)}>
      <div className="flex items-start gap-2.5 px-3.5 pt-3">
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border">
          <CircleHelpIcon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] leading-snug">{question}</p>
          <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
            {reason}
          </p>
        </div>
      </div>

      <div className="mx-3.5 mt-3 rounded-md border bg-muted/40 px-2.5 py-2">
        <p className="text-[10.5px] text-muted-foreground uppercase tracking-[0.14em]">
          {actionLabel}
        </p>
        {isEditing ? (
          <textarea
            autoFocus
            className="mt-1 w-full resize-none bg-transparent font-mono text-[12px] outline-none"
            onChange={(event) => setAmended(event.target.value)}
            rows={2}
            value={amended}
          />
        ) : (
          <p className="mt-0.5 font-mono text-[12px]">{actionPreview}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
        <button
          className={cn(
            "text-[12px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline",
            isEditing && "text-foreground underline"
          )}
          onClick={() => setIsEditing((value) => !value)}
          type="button"
        >
          <PencilLineIcon className="mr-1 inline size-3" />
          {isEditing ? "Editing" : "Edit request"}
        </button>
        <div className="flex items-center gap-1.5">
          <Button
            className="h-7 gap-1 px-2.5 text-[12px]"
            onClick={() => resolve("rejected")}
            size="sm"
            type="button"
            variant="ghost"
          >
            <XIcon className="size-3.5" />
            Reject
          </Button>
          {isEditing ? (
            <Button
              className="h-7 gap-1 px-2.5 text-[12px]"
              onClick={() => resolve("edited")}
              size="sm"
              type="button"
            >
              <CheckIcon className="size-3.5" />
              Approve edited
            </Button>
          ) : (
            <Button
              className="h-7 gap-1 px-2.5 text-[12px]"
              onClick={() => resolve("approved")}
              size="sm"
              type="button"
            >
              <CheckIcon className="size-3.5" />
              Approve
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
