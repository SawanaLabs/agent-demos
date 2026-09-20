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
// Slots describe the planned output contract, independently of execution state.
export function resultSlots(node: CanvasNode) {
  return ["image", "text", "gif"].includes(node.kind)
    ? Array.from(
        { length: node.kind === "gif" ? 1 : (node.resultCount ?? 1) },
        (_, index) => index
      )
    : [];
}

export function presentationEdges(graph: CanvasGraph) {
  return [
    ...graph.edges.map((edge) => ({
      id: edgeId(edge),
      source:
        edge.resultIndex !== undefined &&
        graph.nodes.some(
          (node) =>
            node.id === edge.source &&
            resultSlots(node).includes(edge.resultIndex ?? -1)
        )
          ? resultId(edge.source, edge.resultIndex)
          : workflowId(edge.source),
      target: workflowId(edge.target),
    })),
    ...graph.nodes.flatMap((node) =>
      resultSlots(node).map((index) => ({
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
