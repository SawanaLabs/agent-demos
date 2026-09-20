import { generateImage, generateText } from "ai";
import sharp from "sharp";
import {
  type CanvasGraph,
  type CanvasNode,
  type CanvasOutput,
  executionOrder,
  invalidateOutputs,
  materialOutput,
  parseGraph,
} from "../model/graph";
import { availableResultPosition, hasResult } from "../model/presentation";
import { canvasModels } from "./env";
import { assembleGif } from "./gif";

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
  if (node.kind === "gif") {
    const images = inputs.flatMap((input) =>
      input.image ? [input.image] : []
    );
    if (images.length !== 1) {
      throw new Error("合成 GIF 需要连接一张网格图片。");
    }
    return {
      image: await assembleGif(
        images[0] as string,
        node.gif ?? { rows: 2, columns: 2, fps: 4 }
      ),
    };
  }
  const models = canvasModels();
  const text = `${node.prompt}\nUpstream text:\n${inputs.flatMap((input) => (input.text ? [input.text] : [])).join("\n\n")}`;
  const images = await Promise.all(
    inputs
      .flatMap((input) => (input.image ? [input.image] : []))
      .map(async (image) => {
        if (!image.startsWith("data:image/gif")) {
          return image;
        }
        const png = await sharp(
          Buffer.from(image.split(",")[1] ?? "", "base64")
        )
          .png()
          .toBuffer();
        return `data:image/png;base64,${png.toString("base64")}`;
      })
  );
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
    const message = inputError(graph, requireNode(graph, id));
    if (message) {
      fail(id, message);
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
        node.kind === "gif"
          ? "GIF 合成失败，请检查上游是否为图片，以及网格行列设置。"
          : "生成失败，请检查模型配置或稍后重试。已完成的上游结果仍可复用。"
      );
    }
    if (hasResult(graph, id)) {
      node.resultPosition = availableResultPosition(graph, node);
    }
    graph.revision += 1;
    onProgress?.(graph, null);
  }
  return graph;
}

function needsPrompt(graph: CanvasGraph, node: CanvasNode) {
  if (
    ["reference", "output", "gif"].includes(node.kind) ||
    node.prompt.trim()
  ) {
    return false;
  }
  return (
    node.kind === "prompt" ||
    !graph.edges.some((edge) => edge.target === node.id)
  );
}

function inputError(graph: CanvasGraph, node: CanvasNode) {
  if (node.kind === "reference" && !graph.assets[node.id]) {
    return `请为「${node.label}」上传参考图。`;
  }
  if (
    node.kind === "gif" &&
    graph.edges.filter((edge) => edge.target === node.id).length !== 1
  ) {
    return "合成 GIF 需要连接一张网格图片。";
  }
  if (needsPrompt(graph, node)) {
    return `请填写「${node.label}」的提示词。`;
  }
  return;
}
