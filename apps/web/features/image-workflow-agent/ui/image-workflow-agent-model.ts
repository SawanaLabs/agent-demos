"use client";

import { isToolUIPart, type UIMessage } from "ai";
import {
  type ImageWorkflowAcceptedAction,
  normalizeImageWorkflowAcceptedAction,
} from "../model/telemetry";
import {
  applyWorkflowCommand,
  type ImageGeneratorNode,
  type ImageResultNode,
  type ReferenceImageNode,
  type WorkflowGraph,
  type WorkflowPosition,
} from "../model/workflow-engine";

export const imageWorkflowAgentSuggestions = [
  "Build a restrained editorial poster for a design exhibition.",
  "Turn the reference image into a premium lifestyle campaign.",
  "Create a clean 16:9 product hero for a landing page.",
  "Make a vertical fashion image with softer lighting and grain.",
] as const;

interface WorkflowToolOutput {
  acceptedAction?: unknown;
  graph: WorkflowGraph;
  summary?: string;
}

export function getWorkflowToolDisplayOutput(
  output: unknown
): string | undefined {
  if (!output || typeof output !== "object") {
    return;
  }

  const summary = (output as Partial<WorkflowToolOutput>).summary;

  return typeof summary === "string" ? summary : undefined;
}

function isWorkflowGraph(value: unknown): value is WorkflowGraph {
  if (!value || typeof value !== "object") {
    return false;
  }

  const graph = value as Partial<WorkflowGraph>;

  return (
    Array.isArray(graph.edges) &&
    Array.isArray(graph.nodes) &&
    typeof graph.revision === "number"
  );
}

interface WorkflowNodeChangeLike {
  dragging?: boolean;
  id?: string;
  position?: WorkflowPosition;
  selected?: boolean;
  type: string;
}

export function commitAcceptedWorkflowGraph(
  graphRef: { current: WorkflowGraph },
  acceptedGraph: WorkflowGraph,
  commit: (graph: WorkflowGraph) => void
) {
  graphRef.current = acceptedGraph;
  commit(acceptedGraph);
}

export function hasGraphChangingNodeChange(
  changes: readonly WorkflowNodeChangeLike[]
) {
  return changes.some(
    (change) =>
      change.type === "remove" ||
      (change.type === "position" && Boolean(change.position))
  );
}

export function shouldTrackWorkflowNodeChanges(
  changes: readonly WorkflowNodeChangeLike[]
) {
  return changes.some(
    (change) =>
      change.type === "remove" ||
      (change.type === "position" &&
        Boolean(change.position) &&
        change.dragging === false)
  );
}

export function shouldTrackWorkflowNodePatch(
  patch: Readonly<Record<string, unknown>>
) {
  return !Object.hasOwn(patch, "image");
}

export function applyWorkflowNodeChanges(
  graph: WorkflowGraph,
  changes: readonly WorkflowNodeChangeLike[]
) {
  let nextGraph = graph;

  for (const change of changes) {
    if (change.type === "remove" && change.id) {
      nextGraph = applyWorkflowCommand(nextGraph, {
        expectedRevision: nextGraph.revision,
        nodeId: change.id,
        type: "delete-node",
      });
    }

    if (change.type === "position" && change.id && change.position) {
      nextGraph = applyWorkflowCommand(nextGraph, {
        expectedRevision: nextGraph.revision,
        nodeId: change.id,
        position: change.position,
        type: "move-node",
      });
    }
  }

  return nextGraph;
}

export function getWorkflowMessageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

export function getLatestWorkflowGraph(messages: UIMessage[]) {
  let latestGraph: WorkflowGraph | null = null;

  for (const message of messages) {
    for (const part of message.parts) {
      if (!isToolUIPart(part) || part.state !== "output-available") {
        continue;
      }

      const output = part.output as WorkflowToolOutput | undefined;

      if (!isWorkflowGraph(output?.graph)) {
        continue;
      }

      if (!latestGraph || output.graph.revision >= latestGraph.revision) {
        latestGraph = output.graph;
      }
    }
  }

  return latestGraph;
}

export function getUnconsumedWorkflowActions(
  messages: UIMessage[],
  consumedIds: ReadonlySet<string>
): Array<{ action: ImageWorkflowAcceptedAction; id: string }> {
  const actions: Array<{ action: ImageWorkflowAcceptedAction; id: string }> =
    [];

  for (const message of messages) {
    for (const part of message.parts) {
      if (!isToolUIPart(part) || part.state !== "output-available") {
        continue;
      }

      const id = `${message.id}:${part.toolCallId}`;

      if (consumedIds.has(id)) {
        continue;
      }

      const output = part.output as WorkflowToolOutput | undefined;
      const action = normalizeImageWorkflowAcceptedAction(
        output?.acceptedAction
      );

      if (action?.source === "agent") {
        actions.push({ action, id });
      }
    }
  }

  return actions;
}

export function getReferenceImageNode(graph: WorkflowGraph) {
  return (
    graph.nodes.find(
      (node): node is ReferenceImageNode => node.kind === "reference-image"
    ) ?? null
  );
}

export function getImageGeneratorNode(graph: WorkflowGraph) {
  const node = graph.nodes.find(
    (graphNode): graphNode is ImageGeneratorNode =>
      graphNode.kind === "image-generator"
  );

  if (!node) {
    throw new Error("Workflow graph is missing the image generator node.");
  }

  return node;
}

export function getImageResultNode(graph: WorkflowGraph) {
  const node = graph.nodes.find(
    (graphNode): graphNode is ImageResultNode =>
      graphNode.kind === "image-result"
  );

  if (!node) {
    throw new Error("Workflow graph is missing the image result node.");
  }

  return node;
}

export function createReferenceImageNode() {
  return {
    data: {
      image: null,
      label: "Reference image",
    },
    id: `reference-${crypto.randomUUID().slice(0, 8)}`,
    kind: "reference-image" as const,
    position: {
      x: 20,
      y: 180,
    },
  };
}

export function getWorkflowToolTitle(toolType: string) {
  const toolName = toolType.startsWith("tool-")
    ? toolType.slice("tool-".length)
    : toolType;

  switch (toolName) {
    case "addNode":
      return "Add node";
    case "connectNodes":
      return "Connect nodes";
    case "replaceWorkflow":
      return "Replace workflow";
    case "runWorkflow":
      return "Run workflow";
    case "updateNode":
      return "Update node";
    default:
      return toolName;
  }
}

export function getSetupGuidanceLines(issues: string[]) {
  if (issues.length > 0) {
    return issues;
  }

  return [
    "Set AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN before sending chat turns or running the workflow.",
  ];
}
