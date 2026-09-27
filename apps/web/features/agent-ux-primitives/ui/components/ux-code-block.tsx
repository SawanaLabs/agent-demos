"use client";

import { cn } from "@workspace/ui/lib/utils";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

/**
 * UxCodeBlock — agent-written code that streams in line by line.
 *
 * Interaction patterns recreated here:
 * - Lines arrive one at a time with a block caret riding the newest
 *   line; after a hold, the stream loops — the way a demo would replay
 *   generated output.
 * - Tokens are tinted by a hand-rolled lexer table mapped to theme
 *   tokens (keywords → info, strings → success, numbers → warning),
 *   not a syntax-highlighter dependency.
 * - The copy button is live from the start and confirms in place.
 *
 * Driven by a timeout chain — no backend.
 */

const LINE_MS = 240;
const HOLD_MS = 3200;

type Tone = "dim" | "fn" | "kw" | "num" | "str";

interface Token {
  text: string;
  tone?: Tone;
}

const TONE_CLASS: Record<Tone, string> = {
  dim: "text-muted-foreground",
  fn: "text-foreground",
  kw: "text-status-info-600 dark:text-status-info-300",
  num: "text-status-warning-600 dark:text-status-warning-300",
  str: "text-status-success-600 dark:text-status-success-300",
};

const LINES: Token[][] = [
  [
    { text: "export async function ", tone: "kw" },
    { text: "churnBatch", tone: "fn" },
    { text: "() {", tone: "dim" },
  ],
  [
    { text: "  const ", tone: "kw" },
    { text: "flavor = " },
    { text: "await ", tone: "kw" },
    { text: "getFlavor", tone: "fn" },
    { text: "(", tone: "dim" },
    { text: '"pistachio"', tone: "str" },
    { text: ");", tone: "dim" },
  ],
  [
    { text: "  const ", tone: "kw" },
    { text: "base = " },
    { text: "await ", tone: "kw" },
    { text: "dairy." },
    { text: "fetch", tone: "fn" },
    { text: "({ flavor });", tone: "dim" },
  ],
  [
    { text: "  await ", tone: "kw" },
    { text: "freezer." },
    { text: "store", tone: "fn" },
    { text: "(base, { temp: ", tone: "dim" },
    { text: '"-14C"', tone: "str" },
    { text: " });", tone: "dim" },
  ],
  [{ text: "  return ", tone: "kw" }, { text: "base.gallons;" }],
  [{ text: "}", tone: "dim" }],
];

const RAW = `export async function churnBatch() {
  const flavor = await getFlavor("pistachio");
  const base = await dairy.fetch({ flavor });
  await freezer.store(base, { temp: "-14C" });
  return base.gallons;
}`;

export function UxCodeBlock({ className }: { className?: string }) {
  const [count, setCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const done = count >= LINES.length;

  useEffect(() => {
    let delay = LINE_MS;
    if (count === 0) {
      delay = 400;
    } else if (done) {
      delay = HOLD_MS;
    }
    const timer = window.setTimeout(
      () => setCount((c) => (c >= LINES.length ? 0 : c + 1)),
      delay
    );
    return () => window.clearTimeout(timer);
  }, [count, done]);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(RAW).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }, []);

  return (
    <div
      className={cn(
        "w-full max-w-sm overflow-hidden rounded-xl border bg-card",
        className
      )}
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <span className="flex items-baseline gap-2">
          <span className="font-medium font-mono text-[12px] text-foreground">
            churn.ts
          </span>
          <span className="text-[11.5px] text-muted-foreground">
            TypeScript
          </span>
        </span>
        <button
          aria-label="Copy code"
          className={cn(
            "flex h-6 items-center gap-1 rounded-md px-1.5 font-medium text-[11.5px] transition-colors hover:bg-muted",
            copied
              ? "text-status-success-600 dark:text-status-success-300"
              : "text-muted-foreground hover:text-foreground"
          )}
          onClick={copy}
          type="button"
        >
          {copied ? (
            <CheckIcon className="size-3" />
          ) : (
            <CopyIcon className="size-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <pre className="min-h-[137px] bg-muted/40 px-3 py-2.5 font-mono text-[11.5px] leading-[1.7]">
        {LINES.slice(0, count).map((line, i) => (
          <div className="flex" key={i}>
            <span className="w-5 shrink-0 select-none text-right text-[10.5px] text-muted-foreground/60 leading-[1.86]">
              {i + 1}
            </span>
            <span className="whitespace-pre pl-2.5">
              {line.map((token, j) => (
                <span
                  className={
                    token.tone ? TONE_CLASS[token.tone] : "text-foreground/85"
                  }
                  key={j}
                >
                  {token.text}
                </span>
              ))}
              {i === count - 1 && !done ? (
                <span
                  aria-hidden
                  className="ml-0.5 inline-block h-3 w-[3px] translate-y-0.5 animate-pulse rounded-full bg-foreground/80"
                />
              ) : null}
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}
