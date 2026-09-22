"use client";

import { MessageResponse } from "@workspace/ui/components/ai-elements/message";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Copy, Download, Sparkles } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { Feedback, FeedbackStatus } from "../types";

export const statusLabels: Record<FeedbackStatus, string> = {
  received: "Received",
  in_progress: "In progress",
  resolved: "Resolved",
};

export function FeedbackDetail({
  feedback,
  busy,
  aiAvailable,
  onAnalyze,
  onStatus,
}: {
  feedback: Feedback;
  busy: boolean;
  aiAvailable: boolean;
  onAnalyze: () => void;
  onStatus: (status: FeedbackStatus) => void;
}) {
  const [copyState, setCopyState] = useState("Copy issue");
  async function copyIssue() {
    try {
      await navigator.clipboard.writeText(
        feedback.analysis ??
          `${feedback.description}\n\n${JSON.stringify(feedback.context, null, 2)}`
      );
      setCopyState("Copied");
    } catch {
      setCopyState("Copy failed. Select the text below.");
    }
  }
  return (
    <Card className="rr-block min-h-0 flex-1 overflow-y-auto">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Feedback details</CardTitle>
          <span className="text-muted-foreground">
            {new Date(feedback.createdAt).toLocaleString()}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-base">{feedback.description}</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(statusLabels) as [FeedbackStatus, string][]).map(
            ([status, label]) => (
              <Button
                disabled={busy || feedback.status === status}
                key={status}
                onClick={() => onStatus(status)}
                size="sm"
                variant={feedback.status === status ? "secondary" : "ghost"}
              >
                {label}
              </Button>
            )
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {feedback.screenshot ? (
          <a
            download={`feedback-${feedback.id}.png`}
            href={feedback.screenshot}
          >
            <Image
              alt="Captured page with feedback annotations"
              className="h-auto w-full border"
              height={900}
              src={feedback.screenshot}
              unoptimized
              width={1600}
            />
            <span className="mt-2 inline-flex items-center gap-1 text-muted-foreground">
              <Download size={14} />
              Download screenshot
            </span>
          </a>
        ) : (
          <p className="text-muted-foreground">No screenshot attached.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy || !aiAvailable} onClick={onAnalyze}>
            <Sparkles size={16} />
            {busy ? "Working…" : "Analyze with AI"}
          </Button>
          <Button onClick={copyIssue} variant="outline">
            <Copy size={16} />
            {copyState}
          </Button>
        </div>
        {aiAvailable ? null : (
          <p className="text-muted-foreground">
            AI analysis needs an AI Gateway key. Your feedback is already saved.
          </p>
        )}
        {feedback.analysis ? (
          <MessageResponse>{feedback.analysis}</MessageResponse>
        ) : (
          <p className="text-muted-foreground">
            AI reads the report, selected elements and screenshot to draft an
            issue for your developer.
          </p>
        )}
        <details>
          <summary className="cursor-pointer text-muted-foreground">
            Captured page context
          </summary>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs">
            {JSON.stringify(feedback.context, null, 2)}
          </pre>
        </details>
        {feedback.recording ? (
          <a
            className="inline-flex items-center gap-2 underline"
            download={`feedback-${feedback.id}-replay.json`}
            href={`data:application/json;charset=utf-8,${encodeURIComponent(feedback.recording)}`}
          >
            <Download size={14} />
            Download interaction replay
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}
