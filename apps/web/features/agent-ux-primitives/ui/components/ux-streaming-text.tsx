"use client";

import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { PauseIcon, PlayIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * UxStreamingText — a paragraph that streams itself in char-by-char.
 *
 * Interaction patterns recreated here:
 * - Text types out at a steady cadence with a blinking block caret at
 *   the insertion point.
 * - Pause halts the stream without losing position; Resume continues.
 * - Restart replays the stream from the beginning.
 * - When complete, the caret fades away and controls collapse.
 *
 * Driven by setInterval against a local cursor — no backend required.
 */

interface UxStreamingTextProps {
  autoStart?: boolean;
  /** characters per tick */
  chunkSize?: number;
  className?: string;
  /** ms between ticks */
  intervalMs?: number;
  text?: string;
}

const defaultText =
  "I found three candidate implementations. The first keeps the tool loop inside the provider, which is simpler but harder to audit. The second runs every tool as a local function call and gives you full control of retries, timeouts, and approval gates — this is what I would pick for a demo. The third hybrid approach streams tool calls through a queue so the UI can render progress while the model keeps working.";

export function UxStreamingText({
  text = defaultText,
  chunkSize = 3,
  intervalMs = 24,
  autoStart = true,
  className,
}: UxStreamingTextProps) {
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(autoStart);
  const timerRef = useRef<number | null>(null);

  const done = cursor >= text.length;

  useEffect(() => {
    if (!playing || done) {
      return;
    }
    timerRef.current = window.setInterval(() => {
      setCursor((current) => Math.min(current + chunkSize, text.length));
    }, intervalMs);
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [playing, done, chunkSize, intervalMs, text.length]);

  const restart = () => {
    setCursor(0);
    setPlaying(true);
  };

  return (
    <div className={cn("rounded-lg border bg-background p-3.5", className)}>
      <p className="min-h-16 whitespace-pre-wrap text-[13.5px]/relaxed">
        {text.slice(0, cursor)}
        {done ? null : (
          <span
            aria-hidden
            className="ml-0.5 inline-block h-[1em] w-[7px] translate-y-[2px] animate-pulse bg-foreground/80"
          />
        )}
      </p>
      <div className="mt-3 flex items-center justify-between border-t pt-2.5">
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {done ? "streamed" : "streaming"} · {cursor}/{text.length} chars
        </span>
        <div className="flex items-center gap-1">
          {done ? null : (
            <Button
              aria-label={playing ? "Pause stream" : "Resume stream"}
              className="h-7 w-7"
              onClick={() => setPlaying((value) => !value)}
              size="icon"
              type="button"
              variant="ghost"
            >
              {playing ? (
                <PauseIcon className="size-3.5" />
              ) : (
                <PlayIcon className="size-3.5" />
              )}
            </Button>
          )}
          <Button
            aria-label="Restart stream"
            className="h-7 gap-1 px-2 text-[12px]"
            onClick={restart}
            size="sm"
            type="button"
            variant="ghost"
          >
            <RotateCcwIcon className="size-3.5" />
            Replay
          </Button>
        </div>
      </div>
    </div>
  );
}
