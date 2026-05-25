import { hasTraceEvalResearchIntent } from "./trace-eval-prompt-intent";
import type { TraceEvalSnapshot } from "./trace-eval-snapshot";

const refusalPatterns = [
  /\bi cannot assist with that request\b/i,
  /\bi can't assist with that request\b/i,
  /\bi cannot help with that request\b/i,
  /\bi can't help with that request\b/i,
  /\bi'm sorry, but i cannot assist\b/i,
  /\bi'm sorry, but i can't assist\b/i,
];

export function isTraceEvalRefusalAnswer(answer: string) {
  const normalizedAnswer = answer.trim();

  if (normalizedAnswer.length === 0) {
    return false;
  }

  return refusalPatterns.some((pattern) => pattern.test(normalizedAnswer));
}

export function shouldEvaluateTraceEvalSnapshot(snapshot: TraceEvalSnapshot) {
  return Boolean(
    snapshot.status === "complete" &&
      hasTraceEvalResearchIntent(snapshot.latestPrompt) &&
      snapshot.latestAnswer.trim() &&
      !isTraceEvalRefusalAnswer(snapshot.latestAnswer)
  );
}

export function hasTraceEvalFailedGeneration(snapshot: TraceEvalSnapshot) {
  return Boolean(
    snapshot.status === "complete" &&
      hasTraceEvalResearchIntent(snapshot.latestPrompt) &&
      !snapshot.latestAnswer.trim()
  );
}
