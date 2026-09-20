import { type CanvasGraph, materialOutput } from "./graph";
import { edgeId, outputItems } from "./results";

export type CanvasContentType = "text" | "image";

export function connectedInputs(graph: CanvasGraph, target: string) {
  return graph.edges
    .filter((edge) => edge.target === target)
    .flatMap((edge) => {
      const source = graph.nodes.find((node) => node.id === edge.source);
      if (!source) {
        return [];
      }
      const items = outputItems(
        materialOutput(graph, source) ?? graph.outputs[source.id]
      );
      const count = ["text", "image"].includes(source.kind)
        ? (source.resultCount ?? 1)
        : 1;
      const indices =
        edge.resultIndex === undefined
          ? Array.from({ length: count }, (_, index) => index)
          : [edge.resultIndex];
      return indices.map((index) => {
        const item = items[index];
        const type: CanvasContentType = ["text", "prompt"].includes(source.kind)
          ? "text"
          : "image";
        return {
          id: `${edgeId(edge)}:${index}`,
          type,
          label: `${source.label}${count > 1 ? ` · ${item?.label ?? `结果 ${index + 1}`}` : ""}`,
          ready: Boolean(item?.text?.trim() || item?.image),
          pending: ["prompt", "reference"].includes(source.kind)
            ? "待输入"
            : "待生成",
        };
      });
    });
}
