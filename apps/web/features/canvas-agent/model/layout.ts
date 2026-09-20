import { Graph, layout } from "@dagrejs/dagre";
import type { CanvasGraph } from "./graph";
import {
  presentationEdges,
  resultId,
  resultSlots,
  workflowId,
} from "./presentation";

interface MeasuredNode {
  id: string;
  measured?: { width?: number; height?: number };
}

export function arrangeGraph(
  graph: CanvasGraph,
  measuredNodes: MeasuredNode[]
) {
  const diagram = new Graph();
  diagram.setGraph({
    rankdir: "LR",
    ranksep: 100,
    nodesep: 72,
    marginx: 48,
    marginy: 48,
  });
  diagram.setDefaultEdgeLabel(() => ({}));
  const measurements = new Map(
    measuredNodes.map((node) => [node.id, node.measured])
  );
  for (const node of graph.nodes) {
    const ids = [workflowId(node.id)];
    if (resultSlots(node).length > 0) {
      ids.push(...resultSlots(node).map((index) => resultId(node.id, index)));
    }
    for (const id of ids) {
      const size = measurements.get(id);
      if (!(size?.width && size.height)) {
        throw new Error("节点尺寸尚未就绪，请稍后再整理画布。");
      }
      diagram.setNode(id, { width: size.width, height: size.height });
    }
  }
  for (const edge of presentationEdges(graph)) {
    diagram.setEdge(edge.source, edge.target);
  }
  layout(diagram);
  function position(id: string) {
    const node = diagram.node(id);
    return { x: node.x - node.width / 2, y: node.y - node.height / 2 };
  }
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      position: position(workflowId(node.id)),
      ...(resultSlots(node).length > 0
        ? {
            resultPosition: position(resultId(node.id)),
            resultPositions: Object.fromEntries(
              resultSlots(node).map((index) => [
                index,
                position(resultId(node.id, index)),
              ])
            ),
          }
        : { resultPosition: undefined, resultPositions: undefined }),
    })),
    edges: graph.edges,
  };
}
