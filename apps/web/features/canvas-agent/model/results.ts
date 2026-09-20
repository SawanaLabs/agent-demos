import type { CanvasGraph, CanvasOutput } from "./graph";

export function outputItems(output: CanvasOutput | undefined) {
  if (!output) {
    return [];
  }
  return output.results ?? (output.text || output.image ? [output] : []);
}

export function edgeInputs(
  graph: CanvasGraph,
  edge: CanvasGraph["edges"][number]
) {
  const items = outputItems(graph.outputs[edge.source]);
  if (edge.resultIndex === undefined) {
    return items;
  }
  const item = items[edge.resultIndex];
  if (!item) {
    throw new Error("连接的生成结果尚不可用，请重新运行上游节点。");
  }
  return [item];
}

export const edgeId = (edge: CanvasGraph["edges"][number]) =>
  `${edge.source}->${edge.target}${edge.resultIndex === undefined ? "" : `:${edge.resultIndex}`}`;
