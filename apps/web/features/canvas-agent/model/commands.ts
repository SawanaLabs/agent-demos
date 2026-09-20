import type { z } from "zod";
import { type CanvasGraph, editGraph, nodeSchema } from "./graph";

export const nodePatchSchema = nodeSchema
  .omit({ id: true, kind: true })
  .partial();

export function updateNode(
  graph: CanvasGraph,
  nodeId: string,
  patch: z.infer<typeof nodePatchSchema>
) {
  if (!graph.nodes.some((node) => node.id === nodeId)) {
    throw new Error("要修改的节点不存在。");
  }
  return editGraph(graph, {
    nodes: graph.nodes.map((node) =>
      node.id === nodeId ? { ...node, ...patch } : node
    ),
    edges: graph.edges,
  });
}

export function connectNodes(
  graph: CanvasGraph,
  source: string,
  target: string,
  resultIndex?: number
) {
  if (
    graph.edges.some(
      (edge) =>
        edge.source === source &&
        edge.target === target &&
        edge.resultIndex === resultIndex
    )
  ) {
    return graph;
  }
  return editGraph(graph, {
    nodes: graph.nodes,
    edges: [
      ...graph.edges,
      { source, target, ...(resultIndex === undefined ? {} : { resultIndex }) },
    ],
  });
}

export function disconnectNodes(
  graph: CanvasGraph,
  source: string,
  target: string,
  resultIndex?: number
) {
  return editGraph(graph, {
    nodes: graph.nodes,
    edges: graph.edges.filter(
      (edge) =>
        !(
          edge.source === source &&
          edge.target === target &&
          edge.resultIndex === resultIndex
        )
    ),
  });
}
