import { type CanvasGraph, type CanvasNode, materialOutput } from "./graph";

export const workflowId = (id: string) => `node:${id}`;
export const resultId = (id: string) => `result:${id}`;
export const originalId = (id: string) => id.slice(id.indexOf(":") + 1);
export const resultPosition = (node: CanvasNode) =>
  node.resultPosition ?? { x: node.position.x + 380, y: node.position.y };
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
  graph.nodes.some((node) => node.id === id && node.kind === "image") &&
  Boolean(graph.outputs[id]?.image);

export function presentationEdges(graph: CanvasGraph) {
  return [
    ...graph.edges.map((edge) => ({
      id: `${edge.source}->${edge.target}`,
      source: hasResult(graph, edge.source)
        ? resultId(edge.source)
        : workflowId(edge.source),
      target: workflowId(edge.target),
    })),
    ...graph.nodes
      .filter((node) => hasResult(graph, node.id))
      .map((node) => ({
        id: `generated:${node.id}`,
        source: workflowId(node.id),
        target: resultId(node.id),
        deletable: false,
        selectable: false,
      })),
  ];
}

export function displayInputs(graph: CanvasGraph, id: string) {
  return graph.edges
    .filter((edge) => edge.target === id)
    .map((edge) => {
      const node = graph.nodes.find((item) => item.id === edge.source);
      return {
        id: edge.source,
        label: node?.label ?? edge.source,
        content:
          (node ? materialOutput(graph, node) : undefined) ??
          graph.outputs[edge.source] ??
          {},
      };
    });
}
