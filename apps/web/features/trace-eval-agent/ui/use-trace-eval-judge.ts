"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import type { DeepPartial } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  completeTraceEvalJudgeResult,
  type TraceEvalJudgeResult,
  type TraceEvalJudgeStreamObject,
  traceEvalJudgeStreamSchema,
} from "../model/trace-eval-judge";
import {
  deriveTraceEvalJudgeProgress,
  type TraceEvalJudgeProgressState,
} from "../model/trace-eval-judge-progress";
import type { TraceEvalRunOutcome } from "../model/trace-eval-run-outcome";
import type { TraceEvalSnapshot } from "../model/trace-eval-snapshot";

export type TraceEvalJudgeViewStatus =
  | "idle"
  | "running"
  | "complete"
  | "failed";

export interface TraceEvalJudgeViewState {
  elapsedMs: number | null;
  error: string | null;
  partial: DeepPartial<TraceEvalJudgeStreamObject> | null;
  progress: TraceEvalJudgeProgressState | null;
  result: TraceEvalJudgeResult | null;
  status: TraceEvalJudgeViewStatus;
}

const invalidJudgeStreamObjectError =
  "Trace eval judge stream ended before returning a valid structured result.";

const initialJudgeState: TraceEvalJudgeViewState = {
  elapsedMs: null,
  error: null,
  partial: null,
  progress: null,
  result: null,
  status: "idle",
};

function buildEvaluationKey({
  outcome,
  snapshot,
}: {
  outcome: TraceEvalRunOutcome;
  snapshot: TraceEvalSnapshot;
}) {
  if (!outcome.shouldJudge) {
    return null;
  }

  return [
    snapshot.runId ?? "no-run-id",
    snapshot.latestPrompt,
    snapshot.latestAnswer,
    snapshot.totalTokens ?? "no-usage",
    snapshot.durationMs ?? "no-duration",
  ].join("\n---\n");
}

function buildRunningJudgeState(
  partial: DeepPartial<TraceEvalJudgeStreamObject> | null,
  elapsedMs: number | null
): TraceEvalJudgeViewState {
  return {
    elapsedMs,
    error: null,
    partial,
    progress: deriveTraceEvalJudgeProgress(partial),
    result: null,
    status: "running",
  };
}

export function useTraceEvalJudge({
  judgeModel,
  outcome,
  snapshot,
}: {
  judgeModel: string;
  outcome: TraceEvalRunOutcome;
  snapshot: TraceEvalSnapshot;
}): TraceEvalJudgeViewState {
  const evaluationKey = useMemo(
    () => buildEvaluationKey({ outcome, snapshot }),
    [outcome, snapshot]
  );
  const lastEvaluationKeyRef = useRef<string | null>(null);
  const activeEvaluationRef = useRef<{
    evaluationKey: string;
    judgeModel: string;
    snapshot: TraceEvalSnapshot;
  } | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const latestObjectRef =
    useRef<DeepPartial<TraceEvalJudgeStreamObject> | null>(null);
  const [state, setState] =
    useState<TraceEvalJudgeViewState>(initialJudgeState);
  const { clear, isLoading, object, stop, submit } = useObject<
    typeof traceEvalJudgeStreamSchema,
    TraceEvalJudgeStreamObject,
    { snapshot: TraceEvalSnapshot }
  >({
    api: "/api/demos/trace-eval-agent/evaluate/stream",
    onError(streamError) {
      setState({
        elapsedMs:
          startedAtRef.current === null
            ? null
            : Math.max(0, Date.now() - startedAtRef.current),
        error: streamError.message,
        partial: latestObjectRef.current,
        progress: latestObjectRef.current
          ? deriveTraceEvalJudgeProgress(latestObjectRef.current)
          : null,
        result: null,
        status: "failed",
      });
    },
    onFinish({ object: finalObject }) {
      const activeEvaluation = activeEvaluationRef.current;
      const parsedJudge = traceEvalJudgeStreamSchema.safeParse(
        finalObject ?? latestObjectRef.current
      );

      if (!activeEvaluation) {
        return;
      }

      if (!parsedJudge.success) {
        setState({
          elapsedMs:
            startedAtRef.current === null
              ? null
              : Math.max(0, Date.now() - startedAtRef.current),
          error: invalidJudgeStreamObjectError,
          partial: latestObjectRef.current,
          progress: latestObjectRef.current
            ? deriveTraceEvalJudgeProgress(latestObjectRef.current)
            : null,
          result: null,
          status: "failed",
        });
        return;
      }

      setState({
        elapsedMs:
          startedAtRef.current === null
            ? null
            : Math.max(0, Date.now() - startedAtRef.current),
        error: null,
        partial: parsedJudge.data,
        progress: null,
        result: completeTraceEvalJudgeResult({
          deterministicFailures: activeEvaluation.snapshot.checks.filter(
            (check) => check.status === "failed"
          ),
          evaluatedAt: new Date().toISOString(),
          judge: parsedJudge.data,
          model: activeEvaluation.judgeModel,
        }),
        status: "complete",
      });
    },
    schema: traceEvalJudgeStreamSchema,
  });

  useEffect(() => {
    latestObjectRef.current = object ?? null;
  }, [object]);

  useEffect(() => {
    if (!isLoading || startedAtRef.current === null) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setState((current) => {
        if (current.status !== "running" || startedAtRef.current === null) {
          return current;
        }

        return {
          ...current,
          elapsedMs: Math.max(0, Date.now() - startedAtRef.current),
        };
      });
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    setState((current) =>
      current.status === "running"
        ? buildRunningJudgeState(
            object ?? null,
            startedAtRef.current === null
              ? null
              : Math.max(0, Date.now() - startedAtRef.current)
          )
        : current
    );
  }, [isLoading, object]);

  useEffect(() => {
    if (snapshot.status !== "complete" || !evaluationKey) {
      lastEvaluationKeyRef.current = null;
      activeEvaluationRef.current = null;
      startedAtRef.current = null;
      latestObjectRef.current = null;
      stop();
      clear();
      setState((current) =>
        current.status === "idle" ? current : initialJudgeState
      );
      return;
    }

    if (lastEvaluationKeyRef.current === evaluationKey) {
      return;
    }

    lastEvaluationKeyRef.current = evaluationKey;
    activeEvaluationRef.current = {
      evaluationKey,
      judgeModel,
      snapshot,
    };
    startedAtRef.current = Date.now();
    latestObjectRef.current = null;
    stop();
    clear();
    setState(buildRunningJudgeState(null, 0));
    submit({ snapshot });
  }, [clear, evaluationKey, judgeModel, snapshot, stop, submit]);

  return state;
}
