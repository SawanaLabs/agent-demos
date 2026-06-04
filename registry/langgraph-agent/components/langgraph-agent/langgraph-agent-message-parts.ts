import type { LangGraphProgressData } from "@/lib/langgraph-agent/server/stream-normalizer";

const nodeLabels: Record<string, string> = {
  answer: "Stream answer",
  plan: "Plan response",
  route: "Route request",
  synthesize: "Prepare final context",
  tool: "Inspect frontend contract",
};

const maxSummaryLength = 220;

function truncateSummary(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= maxSummaryLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxSummaryLength - 1)}...`;
}

function readStringField(state: unknown, field: string) {
  if (typeof state !== "object" || state === null || Array.isArray(state)) {
    return null;
  }

  const value = (state as Record<string, unknown>)[field];

  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readFirstObservation(state: unknown) {
  if (typeof state !== "object" || state === null || Array.isArray(state)) {
    return null;
  }

  const observations = (state as Record<string, unknown>).observations;

  if (!Array.isArray(observations)) {
    return null;
  }

  const firstObservation = observations.find(
    (observation): observation is string =>
      typeof observation === "string" && observation.trim().length > 0
  );

  return firstObservation ?? null;
}

function formatNodeUpdateSummary(
  event: Extract<LangGraphProgressData, { kind: "node-update" }>
) {
  if (event.node === "route") {
    return readStringField(event.state, "route") ?? "Route selected.";
  }

  if (event.node === "tool") {
    return (
      readFirstObservation(event.state) ?? "No frontend contract lookup needed."
    );
  }

  if (event.node === "answer") {
    return "Final answer completed.";
  }

  if (event.node === "plan" || event.node === "synthesize") {
    return readStringField(event.state, "plan") ?? "Prepared run context.";
  }

  if (typeof event.state === "string" && event.state.trim().length > 0) {
    return event.state;
  }

  return "Node completed.";
}

function getLatestProgressByNode(events: LangGraphProgressData[]) {
  const latestByNode = new Map<string, LangGraphProgressData>();

  for (const event of events) {
    latestByNode.set(event.node, event);
  }

  return Array.from(latestByNode.values());
}

export function getLangGraphThinkingText(events: LangGraphProgressData[]) {
  return getLatestProgressByNode(events)
    .map((event) => {
      const label = nodeLabels[event.node] ?? event.node;
      const summary =
        event.kind === "node-token"
          ? "Streaming answer tokens."
          : formatNodeUpdateSummary(event);

      return `- ${label}: ${truncateSummary(summary)}`;
    })
    .join("\n");
}
