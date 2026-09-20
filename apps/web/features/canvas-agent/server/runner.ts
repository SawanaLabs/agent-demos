import { generateText } from "ai";
import {
  type CanvasGraph,
  type CanvasNode,
  type CanvasOutput,
  executionOrder,
  invalidateOutputs,
  parseGraph,
} from "../model/graph";
import { canvasModels } from "./env";

export type NodeExecutor = (
  node: CanvasNode,
  inputs: CanvasOutput[],
  signal?: AbortSignal
) => Promise<CanvasOutput>;

export class CanvasInputError extends Error {}

export const generateNode: NodeExecutor = async (node, inputs, signal) => {
  const models = canvasModels();
  const content = [
    {
      type: "text" as const,
      text: `${node.kind === "image" ? `Generate one image. Aspect ratio ${node.aspectRatio}.` : "Complete the following task."}\n${node.prompt}\nUpstream text:\n${inputs.flatMap((input) => (input.text ? [input.text] : [])).join("\n\n")}`,
    },
    ...inputs.flatMap((input) =>
      input.image ? [{ type: "image" as const, image: input.image }] : []
    ),
  ];
  const result = await generateText({
    model: models[node.kind === "image" ? "image" : "text"],
    messages: [{ role: "user", content }],
    abortSignal: signal,
    maxRetries: 1,
    ...(node.kind === "image"
      ? {
          providerOptions: {
            google: { responseModalities: ["TEXT", "IMAGE"] },
          },
        }
      : {}),
  });
  if (node.kind === "text") {
    return { text: result.text };
  }
  const file = result.files.find((item) => item.mediaType.startsWith("image/"));
  if (!file) {
    throw new Error("生成服务未返回图片。");
  }
  return { image: `data:${file.mediaType};base64,${file.base64}` };
};

export async function runGraph(
  input: CanvasGraph,
  target: string | undefined,
  execute: NodeExecutor = generateNode,
  onProgress?: (graph: CanvasGraph, activeNode: string | null) => void,
  signal?: AbortSignal
) {
  const graph = parseGraph(input);
  const order = executionOrder(graph, target);
  for (const id of order) {
    const node = graph.nodes.find((item) => item.id === id);
    if (!node) {
      throw new Error("节点不存在。");
    }
    if (node.kind === "reference" && !graph.assets[id]) {
      throw new CanvasInputError(`请为「${node.label}」上传参考图。`);
    }
    if (node.kind !== "reference" && !node.prompt.trim()) {
      throw new CanvasInputError(`请填写「${node.label}」的提示词。`);
    }
  }
  graph.outputs = target ? invalidateOutputs(graph, [target]) : {};
  for (const id of order) {
    signal?.throwIfAborted();
    if (graph.outputs[id]) {
      continue;
    }
    const node = graph.nodes.find((item) => item.id === id);
    if (!node) {
      throw new Error("节点不存在。");
    }
    onProgress?.(graph, id);
    const inputs = graph.edges
      .filter((edge) => edge.target === id)
      .map((edge) => graph.outputs[edge.source])
      .filter((output): output is CanvasOutput => Boolean(output));
    graph.outputs[id] =
      node.kind === "reference"
        ? { image: graph.assets[id] }
        : await execute(node, inputs, signal);
    graph.revision += 1;
    onProgress?.(graph, null);
  }
  return graph;
}
