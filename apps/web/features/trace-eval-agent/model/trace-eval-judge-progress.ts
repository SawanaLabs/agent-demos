import type { DeepPartial } from "ai";

import type { TraceEvalJudgeStreamObject } from "./trace-eval-judge";

export type TraceEvalJudgeProgressStep =
  | "starting"
  | "summary"
  | "dimensions"
  | "finalizing";

export interface TraceEvalJudgeProgressState {
  label: string;
  message: string;
  progress: number;
  step: TraceEvalJudgeProgressStep;
}

const startingProgressState: TraceEvalJudgeProgressState = {
  label: "Starting",
  message: "Opening the structured judge stream.",
  progress: 0.08,
  step: "starting",
};

export function deriveTraceEvalJudgeProgress(
  partialJudge: DeepPartial<TraceEvalJudgeStreamObject> | null
): TraceEvalJudgeProgressState {
  if (!partialJudge) {
    return startingProgressState;
  }

  if (partialJudge.action) {
    return {
      label: "Finalizing recommendation",
      message: "The judge is completing the final remediation recommendation.",
      progress: 0.92,
      step: "finalizing",
    };
  }

  if ((partialJudge.dimensions?.length ?? 0) > 0) {
    return {
      label: "Scoring dimensions",
      message: "The judge is filling the dimension-by-dimension scores.",
      progress: 0.72,
      step: "dimensions",
    };
  }

  if (partialJudge.summary || partialJudge.rationale) {
    return {
      label: "Streaming summary",
      message: "The judge is drafting the high-level summary and rationale.",
      progress: 0.32,
      step: "summary",
    };
  }

  return startingProgressState;
}
