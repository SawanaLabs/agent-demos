"use client";

import { cn } from "@workspace/ui/lib/utils";
import {
  ArrowUpIcon,
  HistoryIcon,
  MoreHorizontalIcon,
  PlusIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { type ChatPhase, REPLIES, TABS, type UxReply } from "./ux-chat-data";

/**
 * UxChat — a compact tabbed chat panel with reasoning replies.
 *
 * Interaction patterns recreated here:
 * - Tabs switch the conversation context in the header; action icons sit
 *   beside them, like an agent panel's chrome.
 * - Sending a message slides the user bubble in, then reasoning replies
 *   arrive one at a time — each carries a "source · tool · Ns" label row
 *   over its body, and the newest reply de-blurs as it resolves.
 * - The composer is a stub: Enter or the arrow submits, send stays
 *   disabled on an empty draft.
 *
 * Driven by a small phase machine on timeouts — no backend. Canned
 * replies live in `./ux-chat-data.ts`.
 */

function ReasoningReply({
  reply,
  resolving,
}: {
  reply: UxReply;
  resolving?: boolean;
}) {
  return (
    <div
      className="flex w-full flex-col gap-1 transition-[opacity,filter,transform] duration-300"
      style={{
        filter: resolving ? "blur(0.5px)" : "blur(0)",
        opacity: resolving ? 0.55 : 1,
        transform: resolving ? "scale(0.985)" : "scale(1)",
        transformOrigin: "top left",
      }}
    >
      <div className="flex items-center gap-1 text-[12px] leading-tight">
        <span className="font-medium text-foreground">{reply.label}</span>
        <span className="text-muted-foreground">{reply.sub}</span>
        <span className="text-muted-foreground/70">for {reply.time}</span>
      </div>
      <p className="text-[13px] text-foreground leading-normal">{reply.body}</p>
    </div>
  );
}

export function UxChat({ className }: { className?: string }) {
  const [phase, setPhase] = useState<ChatPhase>("done");
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState(
    "Compare mint chip to last summer"
  );
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);

  useEffect(() => {
    let timer: number | undefined;
    if (phase === "sent") {
      timer = window.setTimeout(() => setPhase("reply1"), 500);
    } else if (phase === "reply1") {
      timer = window.setTimeout(() => setPhase("reply2"), 1400);
    } else if (phase === "reply2") {
      timer = window.setTimeout(() => setPhase("done"), 1200);
    }
    return () => window.clearTimeout(timer);
  }, [phase]);

  const sent = phase !== "idle";
  const canSend = draft.trim().length > 0;

  const send = () => {
    if (!canSend) {
      return;
    }
    setSubmitted(draft.trim());
    setDraft("");
    setPhase("sent");
  };

  return (
    <div
      className={cn(
        "flex h-72 w-full max-w-sm flex-col overflow-hidden rounded-xl border bg-card",
        className
      )}
    >
      <div className="flex shrink-0 items-center justify-between border-b p-1.5">
        <div className="flex items-center">
          {TABS.map((item) => (
            <button
              aria-pressed={tab === item}
              className={cn(
                "rounded-md px-2 py-[3px] text-[13px] text-foreground transition-colors",
                tab === item ? "bg-muted" : "opacity-50 hover:opacity-75"
              )}
              key={item}
              onClick={() => setTab(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0.5">
          {[PlusIcon, HistoryIcon, MoreHorizontalIcon].map((Icon, i) => (
            <button
              aria-label={["New chat", "History", "More actions"][i]}
              className="grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              key={i}
              type="button"
            >
              <Icon className="size-3.5" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 pt-2.5 pb-1">
        <div className="flex justify-end pl-14">
          <div
            className="rounded-xl bg-muted px-3 py-1.5 text-[13px] text-foreground leading-snug transition-[opacity,transform] duration-300"
            style={{
              opacity: sent ? 1 : 0,
              transform: sent ? "translateY(0)" : "translateY(10px)",
            }}
          >
            {submitted}
          </div>
        </div>
        {phase === "reply1" || phase === "reply2" || phase === "done" ? (
          <ReasoningReply reply={REPLIES[0]} />
        ) : null}
        {phase === "reply2" || phase === "done" ? (
          <ReasoningReply reply={REPLIES[1]} resolving={phase === "reply2"} />
        ) : null}
      </div>

      <div className="mt-auto shrink-0 p-1.5">
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-2.5 transition-colors focus-within:border-foreground/25">
          <input
            aria-label="Chat prompt"
            className="min-h-5 bg-transparent text-[13px] text-foreground leading-snug outline-none placeholder:text-muted-foreground"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                send();
              }
            }}
            placeholder={`Ask about ${tab.toLowerCase()}…`}
            value={draft}
          />
          <div className="flex items-center justify-end">
            <button
              aria-label="Send"
              className={cn(
                "grid size-7 place-items-center rounded-lg transition-all enabled:active:scale-95",
                canSend
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
              disabled={!canSend}
              onClick={send}
              type="button"
            >
              <ArrowUpIcon className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
