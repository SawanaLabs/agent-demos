"use client";

import { Canvas } from "@workspace/ui/components/ai-elements/canvas";
import { Controls } from "@workspace/ui/components/ai-elements/controls";
import { Edge } from "@workspace/ui/components/ai-elements/edge";
import type { ComponentProps } from "react";

import type { WorkflowGraph } from "../model/workflow-engine";
import {
  ImageWorkflowAgentCanvasControls,
  type ImageWorkflowAgentCanvasControlsProps,
} from "./image-workflow-agent-canvas-controls";
import {
  getImageGeneratorNode,
  getImageResultNode,
  getReferenceImageNode,
} from "./image-workflow-agent-model";
import {
  ImageGeneratorNodeView,
  ImageResultNodeView,
  ReferenceImageNodeView,
} from "./image-workflow-agent-node-views";

const nodeTypes = {
  "image-generator": GeneratorFlowNode,
  "image-result": ResultFlowNode,
  "reference-image": ReferenceFlowNode,
};

const edgeTypes = {
  animated: Edge.Animated,
  temporary: Edge.Temporary,
};

type CanvasNodes = NonNullable<ComponentProps<typeof Canvas>["nodes"]>;
type CanvasNodeChanges = Parameters<
  NonNullable<ComponentProps<typeof Canvas>["onNodesChange"]>
>[0];

function ReferenceFlowNode({ data }: { data: ReferenceNodeData }) {
  return <ReferenceImageNodeView {...data} />;
}

function GeneratorFlowNode({ data }: { data: GeneratorNodeData }) {
  return <ImageGeneratorNodeView {...data} />;
}

function ResultFlowNode({ data }: { data: ResultNodeData }) {
  return <ImageResultNodeView {...data} />;
}

interface ReferenceNodeData extends ReactFlowNodeBase {
  node: NonNullable<ReturnType<typeof getReferenceImageNode>>;
  onClearImage: () => void;
  onDelete: () => void;
  onUpdateLabel: (value: string) => void;
  onUpload: (fileList: FileList | null) => Promise<void> | void;
}

interface GeneratorNodeData extends ReactFlowNodeBase {
  imageModel: string;
  node: ReturnType<typeof getImageGeneratorNode>;
  onAspectRatioChange: (value: "1:1" | "16:9" | "9:16") => void;
  onPromptChange: (value: string) => void;
}

interface ResultNodeData extends ReactFlowNodeBase {
  node: ReturnType<typeof getImageResultNode>;
}

interface ReactFlowNodeBase {
  disabled: boolean;
}

export interface ImageWorkflowAgentCanvasProps {
  controls: ImageWorkflowAgentCanvasControlsProps;
  disabled: boolean;
  graph: WorkflowGraph;
  imageModel: string;
  onConnect: (connection: {
    source: string | null;
    target: string | null;
  }) => void;
  onDeleteReferenceNode: (nodeId: string) => void;
  onGeneratorAspectRatioChange: (
    nodeId: string,
    value: "1:1" | "16:9" | "9:16"
  ) => void;
  onGeneratorPromptChange: (nodeId: string, value: string) => void;
  onNodesChange: (changes: CanvasNodeChanges) => void;
  onReferenceImageClear: (nodeId: string) => void;
  onReferenceImageUpload: (
    nodeId: string,
    fileList: FileList | null
  ) => Promise<void>;
  onReferenceLabelChange: (nodeId: string, value: string) => void;
}

function toFlowNodes(
  input: Omit<
    ImageWorkflowAgentCanvasProps,
    "graph" | "onConnect" | "onNodesChange"
  > & { graph: WorkflowGraph }
): CanvasNodes {
  const generatorNode = getImageGeneratorNode(input.graph);
  const resultNode = getImageResultNode(input.graph);
  const referenceNode = getReferenceImageNode(input.graph);

  const nodes: CanvasNodes = [
    {
      data: {
        disabled: input.disabled,
        imageModel: input.imageModel,
        node: generatorNode,
        onAspectRatioChange: (value) =>
          input.onGeneratorAspectRatioChange(generatorNode.id, value),
        onPromptChange: (value) =>
          input.onGeneratorPromptChange(generatorNode.id, value),
      } satisfies GeneratorNodeData,
      deletable: false,
      draggable: !input.disabled,
      id: generatorNode.id,
      position: generatorNode.position,
      type: generatorNode.kind,
    },
    {
      data: {
        disabled: input.disabled,
        node: resultNode,
      } satisfies ResultNodeData,
      deletable: false,
      draggable: !input.disabled,
      id: resultNode.id,
      position: resultNode.position,
      type: resultNode.kind,
    },
  ];

  if (referenceNode) {
    nodes.push({
      data: {
        disabled: input.disabled,
        node: referenceNode,
        onClearImage: () => input.onReferenceImageClear(referenceNode.id),
        onDelete: () => input.onDeleteReferenceNode(referenceNode.id),
        onUpdateLabel: (value) =>
          input.onReferenceLabelChange(referenceNode.id, value),
        onUpload: (fileList) =>
          input.onReferenceImageUpload(referenceNode.id, fileList),
      } satisfies ReferenceNodeData,
      deletable: true,
      draggable: !input.disabled,
      id: referenceNode.id,
      position: referenceNode.position,
      type: referenceNode.kind,
    });
  }

  return nodes;
}

function toFlowEdges(graph: WorkflowGraph) {
  return graph.edges.map((edge) => ({
    animated: false,
    data: {},
    deletable: false,
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "animated",
  }));
}

export function ImageWorkflowAgentCanvas(props: ImageWorkflowAgentCanvasProps) {
  return (
    <div className="relative h-full overflow-hidden border border-foreground/10 bg-background">
      <Canvas
        className="h-full w-full bg-muted/20"
        defaultEdgeOptions={{ type: "animated" }}
        edges={toFlowEdges(props.graph)}
        edgeTypes={edgeTypes}
        fitViewOptions={{ maxZoom: 1, padding: 0.18 }}
        minZoom={0.65}
        nodes={toFlowNodes(props)}
        nodesDraggable={!props.disabled}
        nodeTypes={nodeTypes}
        onConnect={props.onConnect}
        onNodesChange={props.onNodesChange}
        proOptions={{ hideAttribution: true }}
      >
        <Controls
          className="!left-4 !bottom-4 !top-auto"
          position="bottom-left"
        />
        <ImageWorkflowAgentCanvasControls {...props.controls} />
      </Canvas>
    </div>
  );
}
