"use client";

import { cn } from "@workspace/ui/lib/utils";

interface DiffLine {
  after: string;
  before: string;
  kind: "added" | "changed" | "removed" | "unchanged";
}

function buildDiffLines(before: string, after: string) {
  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const length = Math.max(beforeLines.length, afterLines.length);
  const lines: DiffLine[] = [];

  for (let index = 0; index < length; index += 1) {
    const previousLine = beforeLines[index] ?? "";
    const nextLine = afterLines[index] ?? "";

    if (previousLine === nextLine) {
      lines.push({
        after: nextLine,
        before: previousLine,
        kind: "unchanged",
      });
      continue;
    }

    if (previousLine.length === 0 && nextLine.length > 0) {
      lines.push({
        after: nextLine,
        before: previousLine,
        kind: "added",
      });
      continue;
    }

    if (previousLine.length > 0 && nextLine.length === 0) {
      lines.push({
        after: nextLine,
        before: previousLine,
        kind: "removed",
      });
      continue;
    }

    lines.push({
      after: nextLine,
      before: previousLine,
      kind: "changed",
    });
  }

  return lines;
}

export function UltraChatbotAgentDiffView({
  after,
  before,
}: {
  after: string;
  before: string;
}) {
  const diffLines = buildDiffLines(before, after);

  return (
    <div className="max-h-96 overflow-auto border border-foreground/10 bg-muted/20">
      <div className="border-foreground/10 border-b px-3 py-2 text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Diff preview
      </div>
      <div className="font-mono text-xs">
        {diffLines.map((line, index) => (
          <div
            className={cn(
              "grid grid-cols-[3rem_1fr] gap-3 border-foreground/5 border-b px-3 py-2 last:border-b-0",
              line.kind === "added" && "bg-emerald-500/10",
              line.kind === "changed" && "bg-amber-500/10",
              line.kind === "removed" && "bg-rose-500/10"
            )}
            key={`${index}-${line.kind}`}
          >
            <span className="text-muted-foreground">{index + 1}</span>
            <div className="space-y-1 whitespace-pre-wrap break-words">
              {line.kind === "changed" || line.kind === "removed" ? (
                <div className="text-muted-foreground/80 line-through">
                  {line.before || " "}
                </div>
              ) : null}
              <div>{line.after || " "}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
