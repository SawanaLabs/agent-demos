import { tool } from "ai";
import { z } from "zod";
import {
  connectNodes,
  disconnectNodes,
  nodePatchSchema,
  updateNode,
} from "../model/commands";
import { generationFeedback } from "../model/generation";
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
      inputSchema: z.object({
        source: z.string(),
        target: z.string(),
        resultIndex: z
          .number()
          .int()
          .min(0)
          .max(3)
          .optional()
          .describe(
            "Zero-based result to connect. Required for text/image/GIF generators; omit for prompt or reference materials."
          ),
      }),
      execute: async ({ source, target, resultIndex }) => {
        let feedback: ReturnType<typeof generationFeedback> | undefined;
        const changed = await apply((graph) => {
          const node = graph.nodes.find((item) => item.id === source);
          if (
            node &&
            ["text", "image", "gif"].includes(node.kind) &&
            resultIndex === undefined
          ) {
            throw new Error(
              `请连接生成结果，提供 resultIndex。可用结果：${JSON.stringify(generationFeedback(graph, source).results)}。`
            );
          }
          const next = connectNodes(graph, source, target, resultIndex);
          feedback = generationFeedback(next, target);
          return next;
        });
        return { ...changed, ...feedback };
      },
    }),
    disconnectNodes: tool({
      description:
        "Remove only this connection, retaining both nodes and all other edges. Invalidates target and downstream results.",
      inputSchema: z.object({
        source: z.string(),
        target: z.string(),
        resultIndex: z
          .number()
          .int()
          .min(0)
          .max(3)
          .optional()
          .describe(
            "Optional zero-based result connection to remove; omit to remove the all-results connection."
          ),
      }),
      execute: ({ source, target, resultIndex }) =>
        apply((graph) => disconnectNodes(graph, source, target, resultIndex)),
    }),
  };
}
