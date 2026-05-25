import { z } from "zod";
import type {
  TraceEvalCheck,
  TraceEvalSnapshot,
  TraceEvalSource,
  TraceEvalTraceItem,
} from "./trace-eval-snapshot";

export type TraceEvalJudgeAction =
  | "ready"
  | "needs-revision"
  | "rerun-research"
  | "investigate-failure";

export type TraceEvalJudgeDimensionId =
  | "answer-usefulness"
  | "source-faithfulness"
  | "evidence-sufficiency"
  | "uncertainty-handling"
  | "run-discipline";

export interface TraceEvalJudgeRubricDimension {
  description: string;
  id: TraceEvalJudgeDimensionId;
  title: string;
}

export interface TraceEvalJudgeDimensionScore {
  id: TraceEvalJudgeDimensionId;
  rationale: string;
  score: number;
  title: string;
}

export interface TraceEvalJudgeResult {
  action: TraceEvalJudgeAction;
  deterministicFailures: TraceEvalCheck[];
  dimensions: TraceEvalJudgeDimensionScore[];
  evaluatedAt: string;
  model: string;
  overallScore: number;
  rationale: string;
  summary: string;
}

export interface TraceEvalJudgeContext {
  answer: string;
  deterministicChecks: TraceEvalCheck[];
  deterministicFailures: TraceEvalCheck[];
  prompt: string;
  rubric: TraceEvalJudgeRubricDimension[];
  sources: TraceEvalSource[];
  trace: TraceEvalTraceItem[];
  usage: {
    durationMs?: number;
    totalTokens?: number;
  };
}

export const traceEvalJudgeDimensionSchema = z.object({
  id: z.enum([
    "answer-usefulness",
    "source-faithfulness",
    "evidence-sufficiency",
    "uncertainty-handling",
    "run-discipline",
  ]),
  rationale: z.string().min(1),
  score: z.number().min(0).max(1),
  title: z.string().min(1),
});

export const traceEvalJudgeStreamSchema = z.object({
  action: z.enum([
    "ready",
    "needs-revision",
    "rerun-research",
    "investigate-failure",
  ]),
  dimensions: z.array(traceEvalJudgeDimensionSchema).min(1),
  overallScore: z.number().min(0).max(1),
  rationale: z.string().min(1),
  summary: z.string().min(1),
});

export type TraceEvalJudgeStreamObject = z.infer<
  typeof traceEvalJudgeStreamSchema
>;

export const traceEvalJudgeRubric: TraceEvalJudgeRubricDimension[] = [
  {
    description:
      "Whether the final answer is directly useful for the user's research request.",
    id: "answer-usefulness",
    title: "Answer usefulness",
  },
  {
    description:
      "Whether claims in the answer stay faithful to the visible sources.",
    id: "source-faithfulness",
    title: "Source faithfulness",
  },
  {
    description:
      "Whether the run gathered enough evidence for the requested comparison or recommendation.",
    id: "evidence-sufficiency",
    title: "Evidence sufficiency",
  },
  {
    description:
      "Whether the answer names uncertainty, missing context, or conflicting evidence when needed.",
    id: "uncertainty-handling",
    title: "Uncertainty handling",
  },
  {
    description:
      "Whether the run followed the expected process: use search for current facts, expose sources, avoid bypassing required tools, and explain failures or weak evidence.",
    id: "run-discipline",
    title: "Run discipline",
  },
];

export function buildTraceEvalJudgeContext(
  snapshot: TraceEvalSnapshot
): TraceEvalJudgeContext {
  return {
    answer: snapshot.latestAnswer,
    deterministicChecks: snapshot.checks,
    deterministicFailures: snapshot.checks.filter(
      (check) => check.status === "failed"
    ),
    prompt: snapshot.latestPrompt ?? "",
    rubric: traceEvalJudgeRubric,
    sources: snapshot.sources,
    trace: snapshot.trace,
    usage: {
      durationMs: snapshot.durationMs,
      totalTokens: snapshot.totalTokens,
    },
  };
}

const investigateFailureIds = new Set(["provider-error", "tool-error"]);

export function resolveTraceEvalJudgeAction({
  deterministicFailures,
  overallScore,
}: {
  deterministicFailures: TraceEvalCheck[];
  overallScore: number;
}): TraceEvalJudgeAction {
  if (
    deterministicFailures.some((failure) =>
      investigateFailureIds.has(failure.id)
    )
  ) {
    return "investigate-failure";
  }

  if (deterministicFailures.length > 0) {
    return "rerun-research";
  }

  if (overallScore >= 0.8) {
    return "ready";
  }

  return "needs-revision";
}

export function completeTraceEvalJudgeResult({
  deterministicFailures,
  evaluatedAt,
  judge,
  model,
}: {
  deterministicFailures: TraceEvalCheck[];
  evaluatedAt: string;
  judge: TraceEvalJudgeStreamObject;
  model: string;
}): TraceEvalJudgeResult {
  return {
    ...judge,
    action: resolveTraceEvalJudgeAction({
      deterministicFailures,
      overallScore: judge.overallScore,
    }),
    deterministicFailures,
    evaluatedAt,
    model,
  };
}

export function formatTraceEvalJudgePrompt(
  context: TraceEvalJudgeContext
): string {
  return [
    "Evaluate this AI research-agent run.",
    "",
    "User prompt:",
    context.prompt || "No user prompt captured.",
    "",
    "Final answer:",
    context.answer || "No final answer captured.",
    "",
    "Deterministic checks:",
    JSON.stringify(context.deterministicChecks, null, 2),
    "",
    "Deterministic failures:",
    JSON.stringify(context.deterministicFailures, null, 2),
    "",
    "Execution trace:",
    JSON.stringify(context.trace, null, 2),
    "",
    "Sources:",
    JSON.stringify(context.sources, null, 2),
    "",
    "Usage:",
    JSON.stringify(context.usage, null, 2),
    "",
    "Rubric dimensions:",
    JSON.stringify(context.rubric, null, 2),
  ].join("\n");
}
