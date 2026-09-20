import {
  type CanvasGraph,
  type CanvasNode,
  executionOrder,
  materialOutput,
} from "./graph";

import { edgeId, outputItems } from "./results";

export const workflowId = (id: string) => `node:${id}`;
export const resultId = (id: string, index = 0) =>
  `result:${id}${index ? `:output:${index}` : ""}`;
export const resultIndex = (id: string) =>
  Number(id.match(/:output:(\d+)$/)?.[1] ?? 0);
export const originalId = (id: string) =>
  id.slice(id.indexOf(":") + 1).replace(/:output:\d+$/, "");
export const resultPosition = (node: CanvasNode, index = 0) => {
  const base = node.resultPosition ?? {
    x: node.position.x + 380,
    y: node.position.y,
  };
  return index === 0
    ? base
    : (node.resultPositions?.[index] ?? { x: base.x, y: base.y + index * 480 });
};
export function availableResultPosition(graph: CanvasGraph, node: CanvasNode) {
  if (node.resultPosition) {
    return node.resultPosition;
  }
  const position = resultPosition(node);
  const occupied = graph.nodes.flatMap((item) => [
    item.position,
    ...(item.resultPosition ? [item.resultPosition] : []),
  ]);
  while (
    occupied.some(
      (other) =>
        Math.abs(position.x - other.x) < 340 &&
        Math.abs(position.y - other.y) < 380
    )
  ) {
    position.y += 420;
  }
  return position;
}

export const hasResult = (graph: CanvasGraph, id: string) =>
  graph.nodes.some(
    (node) => node.id === id && ["image", "text", "gif"].includes(node.kind)
  ) && outputItems(graph.outputs[id]).length > 0;

export function presentationEdges(graph: CanvasGraph) {
  return [
    ...graph.edges.map((edge) => ({
      id: edgeId(edge),
      source:
        hasResult(graph, edge.source) &&
        (edge.resultIndex !== undefined ||
          outputItems(graph.outputs[edge.source]).length === 1)
          ? resultId(edge.source, edge.resultIndex ?? 0)
          : workflowId(edge.source),
      target: workflowId(edge.target),
    })),
    ...graph.nodes
      .filter((node) => hasResult(graph, node.id))
      .flatMap((node) =>
        outputItems(graph.outputs[node.id]).map((_, index) => ({
          id: `generated:${node.id}${index ? `:${index}` : ""}`,
          source: workflowId(node.id),
          target: resultId(node.id, index),
          deletable: false,
          selectable: false,
        }))
      ),
  ];
}

export function displayInputs(graph: CanvasGraph, id: string) {
  return graph.edges
    .filter((edge) => edge.target === id)
    .flatMap((edge) => {
      const node = graph.nodes.find((item) => item.id === edge.source);
      const items = outputItems(
        (node ? materialOutput(graph, node) : undefined) ??
          graph.outputs[edge.source]
      );
      return items.flatMap((content, index) =>
        edge.resultIndex !== undefined && edge.resultIndex !== index
          ? []
          : [
              {
                id: `${edgeId(edge)}:${index}`,
                label: content.label ?? node?.label ?? edge.source,
                content,
              },
            ]
      );
    });
}

export function nodeRunLabel(graph: CanvasGraph, id: string) {
  const upstreamReady = executionOrder(graph, id).every((sourceId) => {
    if (sourceId === id || graph.outputs[sourceId]) {
      return true;
    }
    const node = graph.nodes.find((item) => item.id === sourceId);
    const material = node ? materialOutput(graph, node) : undefined;
    return Boolean(material?.text?.trim() || material?.image);
  });
  return upstreamReady ? "运行此节点" : "运行到这里";
}
