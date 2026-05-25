import type { TraceEvalRunRecord } from "./trace-eval-run-record";
import { isTraceEvalRefusalAnswer } from "./trace-eval-run-state";

export type TraceEvalRunOutcome =
  | {
      detail: string;
      kind: "empty";
      shouldJudge: false;
      title: string;
    }
  | {
      detail: string;
      kind: "running";
      shouldJudge: false;
      title: string;
    }
  | {
      detail: string;
      kind: "skipped";
      reason: "non-research-turn";
      shouldJudge: false;
      title: string;
    }
  | {
      detail: string;
      kind: "failed-run";
      reason: "provider-error" | "refusal" | "missing-answer";
      shouldJudge: false;
      title: string;
    }
  | {
      detail: string;
      kind: "evaluated";
      shouldJudge: true;
      title: string;
    };

export function classifyTraceEvalRunOutcome({
  error,
  record,
}: {
  error?: Error | null;
  record: TraceEvalRunRecord;
}): TraceEvalRunOutcome {
  if (error) {
    return {
      detail: error.message,
      kind: "failed-run",
      reason: "provider-error",
      shouldJudge: false,
      title: "Run failed before evaluation",
    };
  }

  if (record.status === "empty") {
    return {
      detail: "Run a research question to populate trace and eval.",
      kind: "empty",
      shouldJudge: false,
      title: "No run yet",
    };
  }

  if (record.status === "running") {
    return {
      detail: "The latest run is still streaming.",
      kind: "running",
      shouldJudge: false,
      title: "Run in progress",
    };
  }

  if (!record.hasResearchIntent) {
    return {
      detail:
        "This turn looks like casual chat, so trace and eval are skipped without affecting the agent conversation.",
      kind: "skipped",
      reason: "non-research-turn",
      shouldJudge: false,
      title: "Skipped non-research turn",
    };
  }

  if (isTraceEvalRefusalAnswer(record.latestAnswer)) {
    return {
      detail:
        "The assistant refused the run. Retry with a research prompt that allows live search and source-grounded output.",
      kind: "failed-run",
      reason: "refusal",
      shouldJudge: false,
      title: "Run ended in refusal",
    };
  }

  if (!record.latestAnswer.trim()) {
    return {
      detail:
        "The run completed without a final answer. Retry the run before evaluating quality.",
      kind: "failed-run",
      reason: "missing-answer",
      shouldJudge: false,
      title: "Run completed without answer",
    };
  }

  return {
    detail: "The run produced a research answer and can be evaluated.",
    kind: "evaluated",
    shouldJudge: true,
    title: "Ready for evaluation",
  };
}
