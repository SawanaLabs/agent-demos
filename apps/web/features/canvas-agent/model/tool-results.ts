import { z } from "zod";
import { type CanvasGraph, contentSchema } from "./graph";
import { outputItems } from "./results";

export const toolResultsSchema = z.array(
  z.object({
    nodeId: z.string(),
    resultIndex: z.number().int().nonnegative(),
    label: z.string(),
    reused: z.boolean(),
    content: contentSchema,
  })
);

// Snapshot this invocation's results so chat history never follows later graph edits.
export function workflowResults(
  graph: CanvasGraph,
  execution: { completedNodeIds: string[]; reusedNodeIds: string[] }
): z.infer<typeof toolResultsSchema> {
  const completed = new Set(execution.completedNodeIds);
  const reused = new Set(execution.reusedNodeIds);
  return graph.nodes.flatMap((node) => {
    if (
      !(
        ["text", "image", "gif"].includes(node.kind) &&
        (completed.has(node.id) || reused.has(node.id))
      )
    ) {
      return [];
    }
    return outputItems(graph.outputs[node.id]).map((content, resultIndex) => ({
      nodeId: node.id,
      resultIndex,
      label: node.resultLabels?.[resultIndex] ?? content.label ?? node.label,
      reused: !completed.has(node.id),
      content,
    }));
  });
}
