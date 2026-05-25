"use client";

import {
  Test,
  TestName,
  TestResults,
  TestResultsContent,
  TestResultsDuration,
  TestResultsHeader,
  TestResultsProgress,
  TestResultsSummary,
  TestStatus,
  TestSuite,
  TestSuiteContent,
  TestSuiteName,
  TestSuiteStats,
} from "@workspace/ui/components/ai-elements/test-results";

import type { TraceEvalRunOutcome } from "../model/trace-eval-run-outcome";
import type { TraceEvalSnapshot } from "../model/trace-eval-snapshot";
import type { TraceEvalJudgeViewState } from "./use-trace-eval-judge";

export function TraceEvalAgentEvalPanel({
  judge,
  runOutcome,
  snapshot,
}: {
  judge: TraceEvalJudgeViewState;
  runOutcome: TraceEvalRunOutcome;
  snapshot: TraceEvalSnapshot;
}) {
  if (runOutcome.kind === "empty") {
    return (
      <TestResults
        className="rounded-lg border-foreground/10"
        summary={{
          duration: undefined,
          failed: 0,
          passed: 0,
          skipped: 0,
          total: 0,
        }}
      >
        <TestResultsHeader>
          <div>
            <h2 className="font-medium text-sm">Eval</h2>
            <p className="text-muted-foreground text-xs">
              Deterministic gate and LLM judge
            </p>
          </div>
        </TestResultsHeader>

        <TestResultsContent>
          <p className="text-muted-foreground text-sm/relaxed">
            {runOutcome.detail}
          </p>
        </TestResultsContent>
      </TestResults>
    );
  }

  if (runOutcome.kind === "skipped") {
    return (
      <TestResults
        className="rounded-lg border-foreground/10"
        summary={{
          duration: snapshot.durationMs,
          failed: 0,
          passed: 0,
          skipped: snapshot.summary.total,
          total: snapshot.summary.total,
        }}
      >
        <TestResultsHeader>
          <div>
            <h2 className="font-medium text-sm">Eval</h2>
            <p className="text-muted-foreground text-xs">
              Deterministic gate and LLM judge
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TestResultsDuration />
            <TestResultsSummary />
          </div>
        </TestResultsHeader>

        <TestResultsContent>
          <TestSuite defaultOpen name={runOutcome.title} status="skipped">
            <div className="flex items-center">
              <TestSuiteName />
              <TestSuiteStats
                failed={0}
                passed={0}
                skipped={snapshot.summary.total}
              />
            </div>
            <TestSuiteContent>
              <Test name="Evaluation skipped" status="skipped">
                <TestStatus />
                <div className="flex-1">
                  <TestName />
                  <p className="text-muted-foreground text-xs/relaxed">
                    {runOutcome.detail}
                  </p>
                </div>
              </Test>
            </TestSuiteContent>
          </TestSuite>
        </TestResultsContent>
      </TestResults>
    );
  }

  if (runOutcome.kind === "failed-run") {
    return (
      <TestResults
        className="rounded-lg border-foreground/10"
        summary={{
          duration: snapshot.durationMs,
          failed: 1,
          passed: 0,
          skipped: 0,
          total: 1,
        }}
      >
        <TestResultsHeader>
          <div>
            <h2 className="font-medium text-sm">Eval</h2>
            <p className="text-muted-foreground text-xs">
              Deterministic gate and LLM judge
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TestResultsDuration />
            <TestResultsSummary />
          </div>
        </TestResultsHeader>

        <TestResultsContent>
          <TestSuite defaultOpen name={runOutcome.title} status="failed">
            <div className="flex items-center">
              <TestSuiteName />
              <TestSuiteStats failed={1} passed={0} skipped={0} />
            </div>
            <TestSuiteContent>
              <Test name="Run failed before judging" status="failed">
                <TestStatus />
                <div className="flex-1">
                  <TestName />
                  <p className="text-muted-foreground text-xs/relaxed">
                    {runOutcome.detail}
                  </p>
                </div>
              </Test>
            </TestSuiteContent>
          </TestSuite>
        </TestResultsContent>
      </TestResults>
    );
  }

  let suiteStatus: "failed" | "passed" | "running" = "passed";

  if (snapshot.summary.failed > 0) {
    suiteStatus = "failed";
  } else if (snapshot.status === "running") {
    suiteStatus = "running";
  }

  const judgeSuiteStatus = getJudgeSuiteStatus(judge);

  return (
    <TestResults
      className="rounded-lg border-foreground/10"
      summary={{
        duration: snapshot.durationMs,
        ...snapshot.summary,
      }}
    >
      <TestResultsHeader>
        <div>
          <h2 className="font-medium text-sm">Eval</h2>
          <p className="text-muted-foreground text-xs">
            Deterministic gate and LLM judge
          </p>
        </div>
        <div className="flex items-center gap-3">
          <TestResultsDuration />
          <TestResultsSummary />
        </div>
      </TestResultsHeader>

      <TestResultsContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Gate score</span>
            <span className="font-medium">{formatScore(snapshot.score)}</span>
          </div>
          {judge.result ? (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Judge score</span>
              <span className="font-medium">
                {formatScore(judge.result.overallScore)}
              </span>
            </div>
          ) : null}
          {judge.status === "running" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-muted-foreground">Judge progress</span>
                <span className="font-medium">
                  {formatScore(getJudgeProgressValue(judge))}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                <div
                  className="h-full bg-blue-600 transition-[width] duration-300"
                  style={{
                    width: `${Math.max(6, Math.round(getJudgeProgressValue(judge) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
          <TestResultsProgress />
        </div>

        <TestSuite defaultOpen name="Current conversation" status={suiteStatus}>
          <div className="flex items-center">
            <TestSuiteName />
            <TestSuiteStats
              failed={snapshot.summary.failed}
              passed={snapshot.summary.passed}
              skipped={snapshot.summary.skipped}
            />
          </div>
          <TestSuiteContent>
            {snapshot.checks.map((check) => (
              <Test key={check.id} name={check.title} status={check.status}>
                <TestStatus />
                <div className="flex-1">
                  <TestName />
                  <p className="text-muted-foreground text-xs/relaxed">
                    {check.detail}
                  </p>
                </div>
              </Test>
            ))}
          </TestSuiteContent>
        </TestSuite>

        <TestSuite defaultOpen name="LLM judge" status={judgeSuiteStatus}>
          <div className="flex items-center">
            <TestSuiteName />
            {judge.result ? (
              <TestSuiteStats
                failed={judge.result.deterministicFailures.length}
                passed={
                  judge.result.dimensions.filter(
                    (dimension) => dimension.score >= 0.8
                  ).length
                }
                skipped={
                  judge.result.dimensions.filter(
                    (dimension) =>
                      dimension.score >= 0.6 && dimension.score < 0.8
                  ).length
                }
              />
            ) : null}
          </div>
          <TestSuiteContent>
            {renderJudgeContent(judge, runOutcome, snapshot)}
          </TestSuiteContent>
        </TestSuite>
      </TestResultsContent>
    </TestResults>
  );
}

function getJudgeSuiteStatus(
  judge: TraceEvalJudgeViewState
): "failed" | "passed" | "running" | "skipped" {
  if (judge.status === "running") {
    return "running";
  }

  if (judge.status === "idle") {
    return "skipped";
  }

  if (judge.status === "failed") {
    return "failed";
  }

  if (
    judge.result &&
    (judge.result.overallScore < 0.8 ||
      judge.result.deterministicFailures.length > 0)
  ) {
    return "failed";
  }

  return "passed";
}

function getDimensionStatus(score: number): "failed" | "passed" | "skipped" {
  if (score >= 0.8) {
    return "passed";
  }

  return score >= 0.6 ? "skipped" : "failed";
}

function formatScore(score: number) {
  return `${Math.round(score * 100)}%`;
}

function getJudgeProgressValue(judge: TraceEvalJudgeViewState) {
  return judge.progress?.progress ?? 0;
}

function formatJudgeElapsed(judge: TraceEvalJudgeViewState) {
  if (judge.elapsedMs === null) {
    return "Elapsed time is still starting.";
  }

  return `Elapsed ${Math.max(0.1, judge.elapsedMs / 1000).toFixed(1)}s`;
}

function formatJudgeStageLabel(
  step: "starting" | "summary" | "dimensions" | "finalizing"
) {
  switch (step) {
    case "starting":
      return "Starting";
    case "summary":
      return "Streaming summary";
    case "dimensions":
      return "Scoring dimensions";
    case "finalizing":
      return "Finalizing recommendation";
    default:
      return "Judge stage";
  }
}

function renderJudgeContent(
  judge: TraceEvalJudgeViewState,
  runOutcome: TraceEvalRunOutcome,
  snapshot: TraceEvalSnapshot
) {
  if (judge.status === "idle") {
    if (runOutcome.kind === "running") {
      return (
        <Test name="Waiting for completed run" status="running">
          <TestStatus />
          <div className="flex-1">
            <TestName />
            <p className="text-muted-foreground text-xs/relaxed">
              The run is still streaming. The judge starts after the research
              answer completes.
            </p>
          </div>
        </Test>
      );
    }

    if (snapshot.latestPrompt && !snapshot.latestAnswer) {
      return (
        <Test name="Retry required before judging" status="skipped">
          <TestStatus />
          <div className="flex-1">
            <TestName />
            <p className="text-muted-foreground text-xs/relaxed">
              The judge only runs after a completed research answer is
              available. Retry the run to generate an answer before scoring it.
            </p>
          </div>
        </Test>
      );
    }

    return (
      <Test name="Waiting for completed run" status="skipped">
        <TestStatus />
        <div className="flex-1">
          <TestName />
          <p className="text-muted-foreground text-xs/relaxed">
            The judge starts after the research answer finishes.
          </p>
        </div>
      </Test>
    );
  }

  if (judge.status === "running") {
    return (
      <>
        <Test
          name={`Evaluating answer and run${
            judge.progress
              ? `: ${formatJudgeStageLabel(judge.progress.step)}`
              : ""
          }`}
          status="running"
        >
          <TestStatus />
          <div className="flex-1">
            <TestName />
            <p className="text-muted-foreground text-xs/relaxed">
              {judge.progress?.message ??
                "Scoring final-answer quality and full-run quality."}
            </p>
            <p className="mt-1 text-muted-foreground text-xs/relaxed">
              {formatJudgeElapsed(judge)}
            </p>
          </div>
        </Test>

        {judge.partial?.summary ? (
          <Test name="Partial summary" status="running">
            <TestStatus />
            <div className="flex-1">
              <TestName />
              <p className="text-muted-foreground text-xs/relaxed">
                {judge.partial.summary}
              </p>
            </div>
          </Test>
        ) : null}

        {judge.partial?.dimensions?.map((dimension) =>
          dimension ? (
            <Test
              key={
                dimension.id ??
                dimension.title ??
                dimension.rationale ??
                "streaming-dimension"
              }
              name={dimension.title ?? "Streaming dimension"}
              status="running"
            >
              <TestStatus />
              <div className="flex-1">
                <TestName />
                <p className="text-muted-foreground text-xs/relaxed">
                  {dimension.rationale ?? "Scoring dimension."}
                </p>
              </div>
            </Test>
          ) : null
        )}
      </>
    );
  }

  if (judge.status === "failed") {
    return (
      <Test name="Judge request failed" status="failed">
        <TestStatus />
        <div className="flex-1">
          <TestName />
          <p className="text-muted-foreground text-xs/relaxed">{judge.error}</p>
        </div>
      </Test>
    );
  }

  if (!judge.result) {
    return null;
  }

  return (
    <>
      <Test
        name={`Overall: ${judge.result.action}`}
        status={getJudgeSuiteStatus(judge)}
      >
        <TestStatus />
        <div className="flex-1">
          <TestName />
          <p className="text-muted-foreground text-xs/relaxed">
            {judge.result.summary}
          </p>
          <p className="mt-1 text-muted-foreground text-xs/relaxed">
            {judge.result.rationale}
          </p>
        </div>
      </Test>

      {judge.result.deterministicFailures.length > 0 ? (
        <Test name="Hard gate failures" status="failed">
          <TestStatus />
          <div className="flex-1">
            <TestName />
            <p className="text-muted-foreground text-xs/relaxed">
              {judge.result.deterministicFailures
                .map((failure) => failure.title)
                .join(", ")}
            </p>
          </div>
        </Test>
      ) : null}

      {judge.result.dimensions.map((dimension) => (
        <Test
          key={dimension.id}
          name={`${dimension.title}: ${formatScore(dimension.score)}`}
          status={getDimensionStatus(dimension.score)}
        >
          <TestStatus />
          <div className="flex-1">
            <TestName />
            <p className="text-muted-foreground text-xs/relaxed">
              {dimension.rationale}
            </p>
          </div>
        </Test>
      ))}
    </>
  );
}
