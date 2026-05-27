import type { UIMessage } from "ai";
import {
  buildTraceEvalRunRecord,
  type TraceEvalRunRecord,
  type TraceEvalSource,
  type TraceEvalStatus,
} from "./trace-eval-run-record";

export type {
  TraceEvalAgentMessage,
  TraceEvalSource,
  TraceEvalStatus,
} from "./trace-eval-run-record";

export type TraceItemKind = "user" | "model" | "tool" | "source" | "usage";

export interface TraceEvalTraceItem {
  detail: string;
  id: string;
  kind: TraceItemKind;
  metric?: string;
  status: "pending" | "running" | "passed" | "failed";
  title: string;
}

export interface TraceEvalCheck {
  detail: string;
  id: string;
  status: "passed" | "failed" | "running" | "skipped";
  title: string;
}

export interface TraceEvalSummary {
  failed: number;
  passed: number;
  skipped: number;
  total: number;
}

export interface TraceEvalSnapshot {
  checks: TraceEvalCheck[];
  durationMs?: number;
  latestAnswer: string;
  latestPrompt: string | null;
  runId?: string;
  score: number;
  sources: TraceEvalSource[];
  status: TraceEvalStatus;
  summary: TraceEvalSummary;
  totalTokens?: number;
  trace: TraceEvalTraceItem[];
}

const minimumAnswerLength = 120;

function getModelTraceStatus(
  record: TraceEvalRunRecord
): TraceEvalTraceItem["status"] {
  if (!record.model) {
    return "pending";
  }

  return record.status === "running" ? "running" : "passed";
}

function buildTraceItems({
  record,
}: {
  record: TraceEvalRunRecord;
}): TraceEvalTraceItem[] {
  const trace: TraceEvalTraceItem[] = [];

  trace.push({
    detail:
      record.latestPrompt ?? "No research request has been submitted yet.",
    id: "request",
    kind: "user",
    status: record.hasResearchIntent ? "passed" : "pending",
    title: "Research request",
  });

  trace.push({
    detail: record.model
      ? `${record.model} streaming through AI Gateway.`
      : "The model run will appear after the first assistant response starts.",
    id: "model",
    kind: "model",
    status: getModelTraceStatus(record),
    title: "Gateway model run",
  });

  trace.push(
    ...record.searchCalls.map((call) => ({
      detail: call.input
        ? JSON.stringify(call.input)
        : "Search input is still streaming.",
      id: call.id,
      kind: "tool" as const,
      status: call.status,
      title: call.name,
    }))
  );

  if (record.sources.length > 0) {
    trace.push({
      detail: record.sources.map((source) => source.title).join(", "),
      id: "sources",
      kind: "source",
      metric: `${record.sources.length} sources`,
      status: "passed",
      title: "Grounding sources",
    });
  }

  if (record.usage?.totalTokens !== undefined) {
    trace.push({
      detail: [
        `Input ${record.usage.inputTokens ?? "unknown"}`,
        `Output ${record.usage.outputTokens ?? "unknown"}`,
      ].join(" / "),
      id: "usage",
      kind: "usage",
      metric: `${record.usage.totalTokens} tokens`,
      status: "passed",
      title: "Token usage",
    });
  }

  return trace;
}

function buildChecks({
  record,
}: {
  record: TraceEvalRunRecord;
}): TraceEvalCheck[] {
  const completedSearches = record.searchCalls.filter(
    (call) => call.status === "passed"
  );

  return [
    buildResearchQueryCheck(record.hasResearchIntent),
    buildSearchCheck({
      completedSearchCount: completedSearches.length,
      hasPrompt: record.hasResearchIntent,
      hasSearchInFlight:
        record.status === "running" && record.searchCalls.length > 0,
    }),
    buildSourceCoverageCheck({
      hasPrompt: record.hasResearchIntent,
      sourceCount: record.sources.length,
    }),
    buildAnswerShapeCheck({
      answerLength: record.latestAnswer.length,
      hasPrompt: record.hasResearchIntent,
      isBusy: record.status === "running",
    }),
  ];
}

function buildResearchQueryCheck(hasPrompt: boolean): TraceEvalCheck {
  return {
    detail: hasPrompt
      ? "A research question is present in the session."
      : "Submit a research question instead of a casual chat turn to start the evaluation.",
    id: "research-query",
    status: hasPrompt ? "passed" : "skipped",
    title: "Research query present",
  };
}

function buildSearchCheck({
  completedSearchCount,
  hasPrompt,
  hasSearchInFlight,
}: {
  completedSearchCount: number;
  hasPrompt: boolean;
  hasSearchInFlight: boolean;
}): TraceEvalCheck {
  let status: TraceEvalCheck["status"] = "skipped";

  if (completedSearchCount > 0) {
    status = "passed";
  } else if (hasSearchInFlight) {
    status = "running";
  } else if (hasPrompt) {
    status = "failed";
  }

  return {
    detail:
      completedSearchCount > 0
        ? "The agent used the configured Gateway web search tool."
        : "The agent should call the configured web search tool before finalizing current facts.",
    id: "gateway-search",
    status,
    title: "Gateway web search executed",
  };
}

function buildSourceCoverageCheck({
  hasPrompt,
  sourceCount,
}: {
  hasPrompt: boolean;
  sourceCount: number;
}): TraceEvalCheck {
  let status: TraceEvalCheck["status"] = "skipped";

  if (sourceCount >= 2) {
    status = "passed";
  } else if (hasPrompt) {
    status = "failed";
  }

  return {
    detail:
      sourceCount >= 2
        ? `${sourceCount} source links are available on the latest assistant answer.`
        : "The final answer should expose at least two source links.",
    id: "source-coverage",
    status,
    title: "Sources attached",
  };
}

function buildAnswerShapeCheck({
  answerLength,
  hasPrompt,
  isBusy,
}: {
  answerLength: number;
  hasPrompt: boolean;
  isBusy: boolean;
}): TraceEvalCheck {
  let status: TraceEvalCheck["status"] = "skipped";

  if (answerLength >= minimumAnswerLength) {
    status = "passed";
  } else if (isBusy) {
    status = "running";
  } else if (hasPrompt) {
    status = "failed";
  }

  return {
    detail:
      answerLength >= minimumAnswerLength
        ? "The answer contains enough substance for review."
        : "The response is still missing a substantive research summary.",
    id: "answer-shape",
    status,
    title: "Research answer shape",
  };
}

function summarizeChecks(checks: TraceEvalCheck[]): TraceEvalSummary {
  return {
    failed: checks.filter((check) => check.status === "failed").length,
    passed: checks.filter((check) => check.status === "passed").length,
    skipped: checks.filter((check) => check.status === "skipped").length,
    total: checks.length,
  };
}

export function buildTraceEvalSnapshotFromRunRecord(
  record: TraceEvalRunRecord
): TraceEvalSnapshot {
  const checks = buildChecks({
    record,
  });
  const summary = summarizeChecks(checks);

  return {
    checks,
    durationMs: record.durationMs,
    latestAnswer: record.latestAnswer,
    latestPrompt: record.latestPrompt,
    runId: record.runId,
    score: summary.total === 0 ? 0 : summary.passed / summary.total,
    sources: record.sources,
    status: record.status,
    summary,
    totalTokens: record.totalTokens,
    trace: buildTraceItems({ record }),
  };
}

export function buildTraceEvalSnapshot(
  messages: UIMessage[],
  isBusy: boolean
): TraceEvalSnapshot {
  return buildTraceEvalSnapshotFromRunRecord(
    buildTraceEvalRunRecord(messages, isBusy)
  );
}
