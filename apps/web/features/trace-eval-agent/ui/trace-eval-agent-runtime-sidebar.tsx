"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import type { ReactNode } from "react";
import { PageText, usePageCopy } from "@/components/page-copy";

import type { TraceEvalRunOutcome } from "../model/trace-eval-run-outcome";
import type { TraceEvalSnapshot } from "../model/trace-eval-snapshot";
import { TRACE_EVAL_SEARCH_TOOL_NAME } from "../server/model";
import type { TraceEvalAgentRuntimeState } from "../server/runtime";
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
  const pageCopy = usePageCopy();

  return (
    <aside className="space-y-4 lg:min-h-0 lg:overflow-y-auto">
      <SidebarSection title={pageCopy("Meta")}>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{runtimeState.statusLabel}</Badge>
          <Badge variant="outline">{runtimeState.chatModel}</Badge>
          <Badge variant="outline">{TRACE_EVAL_SEARCH_TOOL_NAME}</Badge>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">
              <PageText>{"Runtime"}</PageText>
            </dt>
            <dd>{runtimeState.nodeVersion}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">
              <PageText>{"Score"}</PageText>
            </dt>
            <dd>{formatRunScore(runOutcome, snapshot.score)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">
              <PageText>{"Judge"}</PageText>
            </dt>
            <dd>{formatJudgeState(judge, runOutcome)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">
              <PageText>{"Judge stage"}</PageText>
            </dt>
            <dd>{formatJudgeStage(judge)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">
              <PageText>{"Latency"}</PageText>
            </dt>
            <dd>{formatDuration(snapshot.durationMs)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">
              <PageText>{"Usage"}</PageText>
            </dt>
            <dd>{formatTokenCount(snapshot.totalTokens)}</dd>
          </div>
        </dl>
      </SidebarSection>

      <SidebarSection title={pageCopy("Eval policy")}>
        <ul className="space-y-2 text-muted-foreground text-sm/relaxed">
          <li>
            <PageText>
              {"Use live search before finalizing current facts."}
            </PageText>
          </li>
          <li>
            <PageText>
              {"Keep at least two source links on grounded answers."}
            </PageText>
          </li>
          <li>
            <PageText>
              {"Prefer concise synthesis over copied snippets."}
            </PageText>
          </li>
          <li>
            <PageText>
              {"Flag uncertainty when evidence is incomplete."}
            </PageText>
          </li>
          <li>
            <PageText>
              {"Judge both final-answer quality and full-run quality."}
            </PageText>
          </li>
        </ul>
      </SidebarSection>

      <SidebarSection title={pageCopy("Suggestions")}>
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
