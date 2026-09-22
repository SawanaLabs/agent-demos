"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Crosshair, ExternalLink, Inbox, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Feedback, FeedbackStatus, FeedbackSummary } from "../types";
import { FeedbackDetail, statusLabels } from "./feedback-detail";
import { SamplePage } from "./sample-page";

const API = "/api/demos/feedback-agent";
async function requestJson<T>(path = "", options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    cache: "no-store",
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error ?? "Feedback request failed.");
  }
  return result as T;
}

export function FeedbackWorkspace({
  available,
  aiAvailable,
}: {
  available: boolean;
  aiAvailable: boolean;
}) {
  const [items, setItems] = useState<FeedbackSummary[]>([]);
  const [selected, setSelected] = useState<Feedback | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const widget = useRef<typeof import("makethisbetter").MakeThisBetter | null>(
    null
  );
  const refresh = useCallback(async () => {
    const result = await requestJson<{ feedback: FeedbackSummary[] }>();
    setItems(result.feedback);
  }, []);

  useEffect(() => {
    if (!available) {
      return;
    }
    let active = true;
    async function mount() {
      // Establish the owner cookie before the widget sends its first capture.
      await refresh();
      const { MakeThisBetter } = await import("makethisbetter");
      if (!active) {
        return;
      }
      widget.current = MakeThisBetter;
      MakeThisBetter.init({
        projectKey: "feedback-agent",
        apiUrl: `${window.location.origin}${API}`,
        locale: "en",
        frustrationDetection: false,
        theme: "auto",
      });
      setReady(true);
      const reportId = new URLSearchParams(window.location.search).get(
        "identity"
      );
      if (reportId && /^[a-f0-9]{32}$/.test(reportId)) {
        const result = await requestJson<{ feedback: Feedback }>(
          `/feedback/${reportId}`
        );
        if (active) {
          setSelected(result.feedback);
        }
      }
    }
    mount().catch((cause: Error) => {
      if (active) {
        setError(cause.message);
      }
    });
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        refresh().catch((cause: Error) => {
          if (active) {
            setError(cause.message);
          }
        });
      }
    }, 8000);
    return () => {
      active = false;
      window.clearInterval(interval);
      widget.current?.destroy();
      widget.current = null;
    };
  }, [available, refresh]);

  async function run(operation: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await operation();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Feedback request failed."
      );
    } finally {
      setBusy(false);
    }
  }
  function openFeedback(id: string) {
    return run(async () => {
      const result = await requestJson<{ feedback: Feedback }>(
        `/feedback/${id}`
      );
      setSelected(result.feedback);
    });
  }
  function updateFeedback(status?: FeedbackStatus) {
    if (!selected) {
      return;
    }
    run(async () => {
      const result = await requestJson<{ feedback: Feedback }>(
        `/feedback/${selected.id}${status ? "" : "/analyze"}`,
        {
          method: status ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(status ? { status } : {}),
        }
      );
      setSelected(result.feedback);
      await refresh();
    });
  }

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[290px_minmax(0,1fr)]">
      <Card className="min-h-0">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Inbox size={16} />
              Your feedback<Badge variant="secondary">{items.length}</Badge>
            </CardTitle>
            <Button
              aria-label="Refresh feedback"
              disabled={busy || !available}
              onClick={() => run(refresh)}
              size="icon"
              variant="ghost"
            >
              <RefreshCw size={15} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
          <Button disabled={!ready} onClick={() => widget.current?.open()}>
            <Crosshair size={16} />
            Feedback
          </Button>
          <div className="rr-block min-h-24 flex-1 space-y-2 overflow-y-auto">
            {items.length ? (
              items.map((item) => (
                <Button
                  className="h-auto w-full flex-col items-start gap-2 whitespace-normal p-3 text-left"
                  disabled={busy}
                  key={item.id}
                  onClick={() => openFeedback(item.id)}
                  variant={selected?.id === item.id ? "secondary" : "ghost"}
                >
                  <span className="line-clamp-2">{item.description}</span>
                  <span className="text-muted-foreground text-xs">
                    {statusLabels[item.status]}
                  </span>
                </Button>
              ))
            ) : (
              <div className="py-8 text-muted-foreground text-sm leading-relaxed">
                <p>No feedback yet.</p>
                <p className="mt-2">
                  Click Feedback, select something on the sample page, and
                  describe what should change.
                </p>
              </div>
            )}
          </div>
          <div className="space-y-3 border-t pt-4 text-muted-foreground text-xs leading-relaxed">
            <p>
              Private to this browser. Reports expire after 7 days. Screenshots
              are optional; turn them off before sending private content.
            </p>
            <a
              className="flex items-center gap-1 underline"
              href="https://github.com/makethisbetter/makethisbetter-js"
              rel="noreferrer"
              target="_blank"
            >
              Use Make This Better directly
              <ExternalLink size={12} />
            </a>
            <a
              className="flex items-center gap-1 underline"
              href="https://github.com/SawanaLabs/agent-demos/tree/main/apps/web/features/feedback-agent"
              rel="noreferrer"
              target="_blank"
            >
              Copy this Agent Demo
              <ExternalLink size={12} />
            </a>
          </div>
        </CardContent>
      </Card>
      <div className="flex min-h-0 flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">
            {selected ? "Report and captured evidence" : "Try it on this page"}
          </p>
          {selected ? (
            <Button
              onClick={() => setSelected(null)}
              size="sm"
              variant="outline"
            >
              Back to sample page
            </Button>
          ) : (
            <Badge variant="outline">Live capture</Badge>
          )}
        </div>
        {available ? null : (
          <p role="status">
            Configure REDIS_URL to enable feedback collection.
          </p>
        )}
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        {selected ? (
          <FeedbackDetail
            aiAvailable={aiAvailable}
            busy={busy}
            feedback={selected}
            key={selected.id}
            onAnalyze={() => updateFeedback()}
            onStatus={updateFeedback}
          />
        ) : (
          <SamplePage />
        )}
      </div>
    </div>
  );
}
