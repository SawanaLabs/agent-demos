import type { Node, NodePositionChange } from "@xyflow/react";
import type { CanvasNode } from "../model/graph";
import {
  originalId,
  resultId,
  resultIndex,
  workflowId,
} from "../model/presentation";

// Workflow data owns content and positions; React Flow owns measured UI state.
export function retainNodeState(projected: Node[], previous: Node[]): Node[] {
  const byId = new Map(previous.map((node) => [node.id, node]));
  return projected.map((node) => {
    const existing = byId.get(node.id);
    if (!existing || existing.type !== node.type) {
      return node;
    }
    return {
      ...node,
      measured: existing.measured,
      selected: existing.selected,
      dragging: existing.dragging,
    };
  });
}

export function moveCanvasNodes(
  nodes: CanvasNode[],
  moves: NodePositionChange[]
) {
  return nodes.map((node) => {
    const move = moves.find((change) => change.id === workflowId(node.id));
    const resultMove = moves.find((change) => change.id === resultId(node.id));
    return {
      ...node,
      ...(move?.position ? { position: move.position } : {}),
      resultPositions: {
        ...node.resultPositions,
        ...Object.fromEntries(
          moves.flatMap((change) =>
            change.id.startsWith("result:") &&
            originalId(change.id) === node.id &&
            change.position
              ? [[resultIndex(change.id), change.position]]
              : []
          )
        ),
      },
      ...(resultMove?.position ? { resultPosition: resultMove.position } : {}),
    };
  });
}
