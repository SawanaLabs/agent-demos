import { tool } from "ai";
import { z } from "zod";
import {
  connectNodes,
  disconnectNodes,
  nodePatchSchema,
  updateNode,
} from "../model/commands";
import type { CanvasGraph } from "../model/graph";

type ApplyEdit = (
  change: (graph: CanvasGraph) => CanvasGraph
) => Promise<{ invalidatedNodeIds: string[] }>;

export function createCanvasEditTools(apply: ApplyEdit) {
  return {
    updateNode: tool({
      description:
        "Update only supplied fields of one node. Omit unchanged fields. Renaming/moving preserves results; generation changes invalidate only this node and descendants.",
      inputSchema: z.object({ nodeId: z.string(), patch: nodePatchSchema }),
      execute: ({ nodeId, patch }) =>
        apply((graph) => updateNode(graph, nodeId, patch)),
    }),
    connectNodes: tool({
      description:
        "Connect an existing source to a target using original node IDs. Preserves other connections and unrelated results. Rejects cycles; connecting an existing edge is a no-op.",
      inputSchema: z.object({ source: z.string(), target: z.string() }),
      execute: ({ source, target }) =>
        apply((graph) => connectNodes(graph, source, target)),
    }),
    disconnectNodes: tool({
      description:
        "Remove only this connection, retaining both nodes and all other edges. Invalidates target and downstream results.",
      inputSchema: z.object({ source: z.string(), target: z.string() }),
      execute: ({ source, target }) =>
        apply((graph) => disconnectNodes(graph, source, target)),
    }),
  };
}
