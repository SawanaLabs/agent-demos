import type {
  AddNodeCommand,
  BuildWorkflowRunPlanOptions,
  ConnectNodesCommand,
  DeleteNodeCommand,
  ImageGeneratorNodeData,
  ImageResultNode,
  MoveNodeCommand,
  ReferenceImageNodeData,
  ReplaceWorkflowCommand,
  RunFailureCommand,
  RunStartCommand,
  RunSuccessCommand,
  UpdateNodeCommand,
  WorkflowCommand,
  WorkflowGraph,
  WorkflowNode,
  WorkflowRunPlan,
} from "./workflow-contract";
import {
  assertRunOwnership,
  assertUniqueNodeKinds,
  assertValidReferenceImage,
  assertValidResultImage,
  assertValidWorkflowGraph,
  assertValidWorkflowNodeData,
  assertValidWorkflowPosition,
  getNodeById,
  getResultNode,
  getRunnableWorkflowState,
  isAllowedConnection,
  isValidPatchForNode,
} from "./workflow-validation";

export type {
  AddNodeCommand,
  BuildWorkflowRunPlanOptions,
  ConnectNodesCommand,
  DeleteNodeCommand,
  ImageGeneratorNode,
  ImageGeneratorNodeData,
  ImageResultNode,
  ImageResultNodeData,
  MoveNodeCommand,
  ReferenceImageNode,
  ReferenceImageNodeData,
  ReplaceWorkflowCommand,
  RunFailureCommand,
  RunStartCommand,
  RunSuccessCommand,
  UpdateNodeCommand,
  WorkflowCommand,
  WorkflowEdge,
  WorkflowGraph,
  WorkflowNode,
  WorkflowPosition,
  WorkflowReferenceImage,
  WorkflowResultImage,
  WorkflowRunPlan,
} from "./workflow-contract";
export function createDefaultWorkflowGraph(): WorkflowGraph {
  return {
    edges: [
      {
        id: "generator-1->result-1",
        source: "generator-1",
        target: "result-1",
      },
    ],
    nodes: [
      {
        data: {
          aspectRatio: "1:1",
          prompt: "",
        },
        id: "generator-1",
        kind: "image-generator",
        position: {
          x: 240,
          y: 180,
        },
      },
      {
        data: {
          activeRunId: null,
          errorMessage: null,
          image: null,
          prompt: null,
          status: "idle",
        },
        id: "result-1",
        kind: "image-result",
        position: {
          x: 640,
          y: 180,
        },
      },
    ],
    revision: 0,
  };
}

function applyAddNode(graph: WorkflowGraph, command: AddNodeCommand) {
  const nodeExists = graph.nodes.some((node) => node.id === command.node.id);

  if (nodeExists) {
    throw new Error(`Workflow node "${command.node.id}" already exists.`);
  }

  assertUniqueNodeKinds(graph, command.node);
  assertValidWorkflowNodeData(command.node);

  return {
    ...graph,
    nodes: [...graph.nodes, command.node],
    revision: graph.revision + 1,
  };
}

function applyConnectNodes(graph: WorkflowGraph, command: ConnectNodesCommand) {
  const sourceNode = graph.nodes.find(
    (node) => node.id === command.sourceNodeId
  );
  const targetNode = graph.nodes.find(
    (node) => node.id === command.targetNodeId
  );

  if (!(sourceNode && targetNode)) {
    throw new Error("Workflow connection references unknown nodes.");
  }

  if (!isAllowedConnection(sourceNode, targetNode)) {
    throw new Error("Invalid workflow connection.");
  }

  const nextEdgeId = `${command.sourceNodeId}->${command.targetNodeId}`;
  const hasEdge = graph.edges.some((edge) => edge.id === nextEdgeId);

  if (hasEdge) {
    return graph;
  }

  return {
    ...graph,
    edges: [
      ...graph.edges,
      {
        id: nextEdgeId,
        source: command.sourceNodeId,
        target: command.targetNodeId,
      },
    ],
    revision: graph.revision + 1,
  };
}

function applyMoveNode(graph: WorkflowGraph, command: MoveNodeCommand) {
  getNodeById(graph, command.nodeId);
  assertValidWorkflowPosition(command.position);

  return {
    ...graph,
    nodes: graph.nodes.map((node) =>
      node.id === command.nodeId
        ? {
            ...node,
            position: command.position,
          }
        : node
    ),
    revision: graph.revision + 1,
  };
}

function applyDeleteNode(graph: WorkflowGraph, command: DeleteNodeCommand) {
  const targetNode = getNodeById(graph, command.nodeId);

  if (targetNode.kind !== "reference-image") {
    throw new Error("Only the optional reference image node can be deleted.");
  }

  return {
    ...graph,
    edges: graph.edges.filter(
      (edge) => edge.source !== command.nodeId && edge.target !== command.nodeId
    ),
    nodes: graph.nodes.filter((node) => node.id !== command.nodeId),
    revision: graph.revision + 1,
  };
}

function applyReplaceWorkflow(
  graph: WorkflowGraph,
  command: ReplaceWorkflowCommand
) {
  assertValidWorkflowGraph(command.graph);
  const replacementResult = command.graph.nodes.find(
    (node): node is ImageResultNode => node.kind === "image-result"
  );

  if (replacementResult?.data.status !== "idle") {
    throw new Error("Replacement workflow result must be idle.");
  }

  return {
    ...command.graph,
    revision: graph.revision + 1,
  };
}

function applyRunStart(graph: WorkflowGraph, command: RunStartCommand) {
  const resultNode = getResultNode(graph, command.nodeId);
  const runnableState = getRunnableWorkflowState(graph);

  if (resultNode.data.status === "running" && resultNode.data.activeRunId) {
    throw new Error(
      `Workflow result node "${resultNode.id}" is already running.`
    );
  }

  return {
    ...graph,
    nodes: graph.nodes.map((node) =>
      node.id === command.nodeId && node.kind === "image-result"
        ? {
            ...node,
            data: {
              ...node.data,
              activeRunId: command.runId,
              errorMessage: null,
              image: null,
              prompt: runnableState.prompt,
              status: "running" as const,
            },
          }
        : node
    ),
    revision: graph.revision + 1,
  };
}

function applyRunSuccess(graph: WorkflowGraph, command: RunSuccessCommand) {
  const resultNode = getResultNode(graph, command.nodeId);
  assertRunOwnership(resultNode, command.runId);
  assertValidResultImage(command.image);

  return {
    ...graph,
    nodes: graph.nodes.map((node) =>
      node.id === command.nodeId && node.kind === "image-result"
        ? {
            ...node,
            data: {
              ...node.data,
              activeRunId: null,
              errorMessage: null,
              image: command.image,
              status: "succeeded" as const,
            },
          }
        : node
    ),
    revision: graph.revision + 1,
  };
}

function applyRunFailure(graph: WorkflowGraph, command: RunFailureCommand) {
  const resultNode = getResultNode(graph, command.nodeId);
  assertRunOwnership(resultNode, command.runId);

  if (!command.errorMessage.trim()) {
    throw new Error("Workflow run failure message is required.");
  }

  return {
    ...graph,
    nodes: graph.nodes.map((node) =>
      node.id === command.nodeId && node.kind === "image-result"
        ? {
            ...node,
            data: {
              ...node.data,
              activeRunId: null,
              errorMessage: command.errorMessage,
              image: null,
              status: "failed" as const,
            },
          }
        : node
    ),
    revision: graph.revision + 1,
  };
}

function updateReferenceNode(
  graph: WorkflowGraph,
  command: UpdateNodeCommand,
  patch: Partial<ReferenceImageNodeData>
) {
  if (patch.image) {
    assertValidReferenceImage(patch.image);
  }

  return graph.nodes.map((node) =>
    node.id === command.nodeId && node.kind === "reference-image"
      ? { ...node, data: { ...node.data, ...patch } }
      : node
  );
}

function updateGeneratorNode(
  graph: WorkflowGraph,
  command: UpdateNodeCommand,
  patch: Partial<ImageGeneratorNodeData>
) {
  return graph.nodes.map((node) =>
    node.id === command.nodeId && node.kind === "image-generator"
      ? { ...node, data: { ...node.data, ...patch } }
      : node
  );
}

function applyUpdateNode(graph: WorkflowGraph, command: UpdateNodeCommand) {
  const targetNode = getNodeById(graph, command.nodeId);

  if (!isValidPatchForNode(targetNode, command.patch)) {
    throw new Error(`Workflow patch is invalid for node "${command.nodeId}".`);
  }

  let nextNodes: WorkflowNode[];

  if (targetNode.kind === "reference-image") {
    nextNodes = updateReferenceNode(
      graph,
      command,
      command.patch as Partial<ReferenceImageNodeData>
    );
  } else if (targetNode.kind === "image-generator") {
    nextNodes = updateGeneratorNode(
      graph,
      command,
      command.patch as Partial<ImageGeneratorNodeData>
    );
  } else {
    throw new Error(`Workflow patch is invalid for node "${command.nodeId}".`);
  }

  return {
    ...graph,
    nodes: nextNodes,
    revision: graph.revision + 1,
  };
}

function assertGraphIsEditable(graph: WorkflowGraph, command: WorkflowCommand) {
  const hasActiveRun = graph.nodes.some(
    (node) => node.kind === "image-result" && node.data.status === "running"
  );
  const isRunTransition =
    command.type === "run-start" ||
    command.type === "run-success" ||
    command.type === "run-failure";

  if (hasActiveRun && !isRunTransition) {
    throw new Error("Workflow is locked while an image run is active.");
  }
}

export function applyWorkflowCommand(
  graph: WorkflowGraph,
  command: WorkflowCommand
): WorkflowGraph {
  if (command.expectedRevision !== graph.revision) {
    throw new Error("Workflow revision mismatch.");
  }

  assertGraphIsEditable(graph, command);

  switch (command.type) {
    case "add-node":
      return applyAddNode(graph, command);
    case "connect-nodes":
      return applyConnectNodes(graph, command);
    case "delete-node":
      return applyDeleteNode(graph, command);
    case "move-node":
      return applyMoveNode(graph, command);
    case "replace-workflow":
      return applyReplaceWorkflow(graph, command);
    case "run-failure":
      return applyRunFailure(graph, command);
    case "run-start":
      return applyRunStart(graph, command);
    case "run-success":
      return applyRunSuccess(graph, command);
    case "update-node":
      return applyUpdateNode(graph, command);
    default: {
      const unsupportedCommand: never = command;
      throw new Error(`Unsupported workflow command: ${unsupportedCommand}`);
    }
  }
}

export function buildWorkflowRunPlan(
  graph: WorkflowGraph,
  options: BuildWorkflowRunPlanOptions
): WorkflowRunPlan {
  assertValidWorkflowGraph(graph);
  const runnableState = getRunnableWorkflowState(graph);

  return {
    aspectRatio: runnableState.aspectRatio,
    imageModel: options.imageModel,
    prompt: runnableState.prompt,
    referenceImage: runnableState.referenceImage,
    resultNodeId: runnableState.resultNodeId,
    revision: graph.revision,
  };
}
