export interface WorkflowReferenceImage {
  dataUrl: string;
  filename: string;
  mediaType: string;
  sizeBytes: number;
}

export interface WorkflowResultImage {
  dataUrl: string;
  mediaType: string;
}

export interface WorkflowPosition {
  x: number;
  y: number;
}

export interface ReferenceImageNodeData {
  image: WorkflowReferenceImage | null;
  label: string;
}

export interface ImageGeneratorNodeData {
  aspectRatio: "1:1" | "16:9" | "9:16";
  prompt: string;
}

export interface ImageResultNodeData {
  activeRunId: string | null;
  errorMessage: string | null;
  image: WorkflowResultImage | null;
  prompt: string | null;
  status: "idle" | "running" | "succeeded" | "failed";
}

export interface ReferenceImageNode {
  data: ReferenceImageNodeData;
  id: string;
  kind: "reference-image";
  position: WorkflowPosition;
}

export interface ImageGeneratorNode {
  data: ImageGeneratorNodeData;
  id: string;
  kind: "image-generator";
  position: WorkflowPosition;
}

export interface ImageResultNode {
  data: ImageResultNodeData;
  id: string;
  kind: "image-result";
  position: WorkflowPosition;
}

export type WorkflowNode =
  | ReferenceImageNode
  | ImageGeneratorNode
  | ImageResultNode;

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowGraph {
  edges: WorkflowEdge[];
  nodes: WorkflowNode[];
  revision: number;
}

export interface UpdateNodeCommand {
  expectedRevision: number;
  nodeId: string;
  patch: Partial<
    ReferenceImageNodeData | ImageGeneratorNodeData | ImageResultNodeData
  >;
  type: "update-node";
}

export interface AddNodeCommand {
  expectedRevision: number;
  node: WorkflowNode;
  type: "add-node";
}

export interface ConnectNodesCommand {
  expectedRevision: number;
  sourceNodeId: string;
  targetNodeId: string;
  type: "connect-nodes";
}

export interface MoveNodeCommand {
  expectedRevision: number;
  nodeId: string;
  position: WorkflowPosition;
  type: "move-node";
}

export interface DeleteNodeCommand {
  expectedRevision: number;
  nodeId: string;
  type: "delete-node";
}

export interface ReplaceWorkflowCommand {
  expectedRevision: number;
  graph: WorkflowGraph;
  type: "replace-workflow";
}

export interface RunStartCommand {
  expectedRevision: number;
  nodeId: string;
  runId: string;
  type: "run-start";
}

export interface RunSuccessCommand {
  expectedRevision: number;
  image: WorkflowResultImage;
  nodeId: string;
  runId: string;
  type: "run-success";
}

export interface RunFailureCommand {
  errorMessage: string;
  expectedRevision: number;
  nodeId: string;
  runId: string;
  type: "run-failure";
}

export type WorkflowCommand =
  | AddNodeCommand
  | ConnectNodesCommand
  | DeleteNodeCommand
  | MoveNodeCommand
  | ReplaceWorkflowCommand
  | RunFailureCommand
  | RunStartCommand
  | RunSuccessCommand
  | UpdateNodeCommand;

export interface BuildWorkflowRunPlanOptions {
  imageModel: string;
}

export interface WorkflowRunPlan {
  aspectRatio: ImageGeneratorNodeData["aspectRatio"];
  imageModel: string;
  prompt: string;
  referenceImage: WorkflowReferenceImage | null;
  resultNodeId: string;
  revision: number;
}
