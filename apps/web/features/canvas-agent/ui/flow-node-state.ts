import type { Node } from "@xyflow/react";

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
