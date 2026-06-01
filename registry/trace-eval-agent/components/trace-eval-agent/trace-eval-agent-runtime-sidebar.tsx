"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

import type { TraceEvalRunOutcome } from "@/lib/trace-eval-agent/model/trace-eval-run-outcome";
import type { TraceEvalSnapshot } from "@/lib/trace-eval-agent/model/trace-eval-snapshot";
import { TRACE_EVAL_SEARCH_TOOL_NAME } from "@/lib/trace-eval-agent/server/model";
import type { TraceEvalAgentRuntimeState } from "@/lib/trace-eval-agent/server/runtime";
import {
  formatDuration,
  formatTokenCount,
  traceEvalAgentSamplePrompts,
} from "./trace-eval-agent-model";
import type { TraceEvalJudgeViewState } from "./use-trace-eval-judge";

interface TraceEvalAgentRuntimeSidebarProps {
  judge: TraceEvalJudgeViewState;
  onPromptSelect: (prompt: string) => void;
  runOutcome: TraceEvalRunOutcome;
  runtimeState: TraceEvalAgentRuntimeState;
  snapshot: TraceEvalSnapshot;
}

function SidebarSection({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="min-h-0 overflow-y-auto rounded-lg border border-foreground/10 bg-background p-4">
      <h2 className="font-medium text-sm">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function TraceEvalAgentRuntimeSidebar({
  judge,
  onPromptSelect,
  runOutcome,
  runtimeState,
  snapshot,
}: TraceEvalAgentRuntimeSidebarProps) {
  return (
    <aside className="space-y-4 lg:min-h-0 lg:overflow-y-auto">
      <SidebarSection title="Meta">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{runtimeState.statusLabel}</Badge>
          <Badge variant="outline">{runtimeState.chatModel}</Badge>
          <Badge variant="outline">{TRACE_EVAL_SEARCH_TOOL_NAME}</Badge>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Runtime</dt>
            <dd>{runtimeState.nodeVersion}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Score</dt>
            <dd>{formatRunScore(runOutcome, snapshot.score)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Judge</dt>
            <dd>{formatJudgeState(judge, runOutcome)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Judge stage</dt>
            <dd>{formatJudgeStage(judge)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Latency</dt>
            <dd>{formatDuration(snapshot.durationMs)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Usage</dt>
            <dd>{formatTokenCount(snapshot.totalTokens)}</dd>
          </div>
        </dl>
      </SidebarSection>

      <SidebarSection title="Eval policy">
        <ul className="space-y-2 text-muted-foreground text-sm/relaxed">
          <li>Use live search before finalizing current facts.</li>
          <li>Keep at least two source links on grounded answers.</li>
          <li>Prefer concise synthesis over copied snippets.</li>
          <li>Flag uncertainty when evidence is incomplete.</li>
          <li>Judge both final-answer quality and full-run quality.</li>
        </ul>
      </SidebarSection>

      <SidebarSection title="Suggestions">
        <div className="space-y-2">
          {traceEvalAgentSamplePrompts.map((item) => (
            <Button
              className="h-auto w-full items-start justify-start whitespace-normal px-3 py-2 text-left text-sm leading-5 [overflow-wrap:anywhere]"
              key={item.prompt}
              onClick={() => onPromptSelect(item.prompt)}
              type="button"
              variant="outline"
            >
              <span className="block text-balance">{item.label}</span>
            </Button>
          ))}
        </div>
      </SidebarSection>
    </aside>
  );
}

function formatJudgeState(
  judge: TraceEvalJudgeViewState,
  runOutcome: TraceEvalRunOutcome
) {
  if (judge.result) {
    return formatScore(judge.result.overallScore);
  }

  if (runOutcome.kind === "skipped") {
    return "Skipped";
  }

  if (runOutcome.kind === "failed-run") {
    return "Not run";
  }

  if (judge.status === "running") {
    return "Running";
  }

  if (judge.status === "failed") {
    return "Failed";
  }

  return "Pending";
}

function formatJudgeStage(judge: TraceEvalJudgeViewState) {
  if (judge.status !== "running") {
    return "--";
  }

  if (!judge.progress) {
    return "Starting";
  }

  return `${judge.progress.label} (${Math.round(judge.progress.progress * 100)}%)`;
}

function formatRunScore(runOutcome: TraceEvalRunOutcome, score: number) {
  if (runOutcome.kind === "skipped" || runOutcome.kind === "failed-run") {
    return "--";
  }

  return formatScore(score);
}

function formatScore(score: number) {
  return `${Math.round(score * 100)}%`;
}
