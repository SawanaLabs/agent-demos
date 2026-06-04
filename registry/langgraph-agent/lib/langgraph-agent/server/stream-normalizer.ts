import type { UIMessageChunk } from "ai";

export type LangGraphProgressData =
  | {
      kind: "node-token";
      node: string;
      runId?: string;
      source: "messages" | "messages-tuple";
      status: "streaming";
    }
  | {
      kind: "node-update";
      node: string;
      source: "updates";
      state: unknown;
      status: "completed";
    };

export interface LangGraphAgentDataParts extends Record<string, unknown> {
  "graph-progress": LangGraphProgressData;
}

export type LangGraphAgentMessageChunk = UIMessageChunk<
  unknown,
  LangGraphAgentDataParts
>;

export interface LangGraphStreamNormalizerOptions {
  textPartId?: string;
}

export interface LangGraphStreamEvent {
  data?: unknown;
  event?: string;
  type?: string;
}

interface MessageTupleMetadata {
  langgraph_node?: unknown;
  run_id?: unknown;
}

interface MessageTupleChunk {
  content?: unknown;
}

const defaultTextPartId = "langgraph-answer";

function getStreamEventType(event: LangGraphStreamEvent) {
  return event.event ?? event.type;
}

function readMessageContent(chunk: unknown) {
  if (typeof chunk === "string") {
    return chunk;
  }

  if (typeof chunk !== "object" || chunk === null) {
    return "";
  }

  const { content } = chunk as MessageTupleChunk;

  return typeof content === "string" ? content : "";
}

function readNodeName(metadata: unknown) {
  if (typeof metadata !== "object" || metadata === null) {
    return "unknown";
  }

  const { langgraph_node } = metadata as MessageTupleMetadata;

  return typeof langgraph_node === "string" && langgraph_node.length > 0
    ? langgraph_node
    : "unknown";
}

function readRunId(metadata: unknown) {
  if (typeof metadata !== "object" || metadata === null) {
    return;
  }

  const { run_id } = metadata as MessageTupleMetadata;

  return typeof run_id === "string" && run_id.length > 0 ? run_id : undefined;
}

function normalizeMessageTuple(
  event: LangGraphStreamEvent,
  eventType: "messages" | "messages-tuple",
  textPartId: string,
  hasStartedText: boolean
) {
  if (!Array.isArray(event.data) || event.data.length < 2) {
    throw new Error(`Expected ${eventType} data to be a message tuple.`);
  }

  const [messageChunk, metadata] = event.data;
  const text = readMessageContent(messageChunk);
  const node = readNodeName(metadata);
  const chunks: LangGraphAgentMessageChunk[] = [
    {
      data: {
        kind: "node-token",
        node,
        runId: readRunId(metadata),
        source: eventType,
        status: "streaming",
      },
      id: `node-${node}`,
      transient: true,
      type: "data-graph-progress",
    },
  ];

  if (!text) {
    return {
      chunks,
      hasStartedText,
    };
  }

  if (!hasStartedText) {
    chunks.push({
      id: textPartId,
      type: "text-start",
    });
  }

  chunks.push({
    delta: text,
    id: textPartId,
    type: "text-delta",
  });

  return {
    chunks,
    hasStartedText: true,
  };
}

function normalizeUpdates(event: LangGraphStreamEvent) {
  if (
    typeof event.data !== "object" ||
    event.data === null ||
    Array.isArray(event.data)
  ) {
    throw new Error("Expected updates data to be an object keyed by node.");
  }

  return Object.entries(event.data).map(
    ([node, state]): LangGraphAgentMessageChunk => ({
      data: {
        kind: "node-update",
        node,
        source: "updates",
        state,
        status: "completed",
      },
      id: `node-${node}`,
      transient: false,
      type: "data-graph-progress",
    })
  );
}

export function createLangGraphStreamNormalizer({
  textPartId = defaultTextPartId,
}: LangGraphStreamNormalizerOptions = {}) {
  let hasStartedText = false;

  return {
    finish(): LangGraphAgentMessageChunk[] {
      if (!hasStartedText) {
        return [];
      }

      hasStartedText = false;

      return [
        {
          id: textPartId,
          type: "text-end",
        },
      ];
    },
    normalize(event: LangGraphStreamEvent): LangGraphAgentMessageChunk[] {
      const eventType = getStreamEventType(event);

      if (eventType === "updates") {
        return normalizeUpdates(event);
      }

      if (eventType === "messages" || eventType === "messages-tuple") {
        const result = normalizeMessageTuple(
          event,
          eventType,
          textPartId,
          hasStartedText
        );
        hasStartedText = result.hasStartedText;

        return result.chunks;
      }

      if (
        eventType === "end" ||
        eventType === "metadata" ||
        eventType === "values"
      ) {
        return [];
      }

      throw new Error(`Unsupported LangGraph stream event: ${eventType}`);
    },
  };
}
