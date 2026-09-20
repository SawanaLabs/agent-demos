import { generateImage, generateText } from "ai";
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
  const text = `${node.prompt}\nUpstream text:\n${inputs.flatMap((input) => (input.text ? [input.text] : [])).join("\n\n")}`;
  const images = inputs.flatMap((input) => (input.image ? [input.image] : []));
  if (node.kind === "image") {
    const sizes = {
      "1:1": "1024x1024",
      "16:9": "1536x864",
      "9:16": "864x1536",
    } as const;
    const result = await generateImage({
      model: models.image,
      prompt: images.length ? { text, images } : text,
      size: sizes[node.aspectRatio],
      providerOptions: { openai: { quality: "low" } },
      abortSignal: signal,
      maxRetries: 1,
    });
    return {
      image: `data:${result.image.mediaType};base64,${result.image.base64}`,
    };
  }
  const result = await generateText({
    model: models.text,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text },
          ...images.map((image) => ({ type: "image" as const, image })),
        ],
      },
    ],
    abortSignal: signal,
    maxRetries: 1,
  });
  return { text: result.text };
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
