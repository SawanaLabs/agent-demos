import { generateImage, generateText } from "ai";
import {
  type CanvasGraph,
  type CanvasNode,
  type CanvasOutput,
  executionOrder,
  invalidateOutputs,
  materialOutput,
  parseGraph,
} from "../model/graph";
import { availableResultPosition } from "../model/presentation";
import { canvasModels } from "./env";

export type NodeExecutor = (
  node: CanvasNode,
  inputs: CanvasOutput[],
  signal?: AbortSignal
) => Promise<CanvasOutput>;

export class CanvasNodeError extends Error {
  readonly nodeId: string;
  constructor(nodeId: string, message: string) {
    super(message);
    this.nodeId = nodeId;
  }
}

function requireNode(graph: CanvasGraph, id: string) {
  const node = graph.nodes.find((item) => item.id === id);
  if (!node) {
    throw new Error("节点不存在。");
  }
  return node;
}

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
    delete graph.errors[id];
  }
  onProgress?.(graph, null);
  function fail(id: string, message: string): never {
    graph.errors[id] = message;
    onProgress?.(graph, null);
    throw new CanvasNodeError(id, message);
  }
  for (const id of order) {
    const node = requireNode(graph, id);
    if (node.kind === "reference" && !graph.assets[id]) {
      fail(id, `请为「${node.label}」上传参考图。`);
    }
    if (needsPrompt(graph, node)) {
      fail(id, `请填写「${node.label}」的提示词。`);
    }
  }
  graph.outputs = target ? invalidateOutputs(graph, [target]) : {};
  for (const id of order) {
    signal?.throwIfAborted();
    if (graph.outputs[id]) {
      continue;
    }
    const node = requireNode(graph, id);
    onProgress?.(graph, id);
    const inputs = graph.edges
      .filter((edge) => edge.target === id)
      .map((edge) => graph.outputs[edge.source])
      .filter((output): output is CanvasOutput => Boolean(output));
    try {
      graph.outputs[id] =
        materialOutput(graph, node) ?? (await execute(node, inputs, signal));
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      fail(
        id,
        "生成失败，请检查模型配置或稍后重试。已完成的上游结果仍可复用。"
      );
    }
    if (node.kind === "image" && graph.outputs[id]?.image) {
      node.resultPosition = availableResultPosition(graph, node);
    }
    graph.revision += 1;
    onProgress?.(graph, null);
  }
  return graph;
}

function needsPrompt(graph: CanvasGraph, node: CanvasNode) {
  if (["reference", "output"].includes(node.kind) || node.prompt.trim()) {
    return false;
  }
  return (
    node.kind === "prompt" ||
    !graph.edges.some((edge) => edge.target === node.id)
  );
}
