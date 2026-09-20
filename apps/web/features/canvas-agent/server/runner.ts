import { generateImage, generateText, Output } from "ai";
import sharp from "sharp";
import { z } from "zod";
import {
  consumeResource,
  ResourceUsageDeniedError,
} from "@/features/shared/resource-usage/server/context";
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
import { edgeInputs, outputItems } from "../model/results";
import { CANVAS_TEXT_PROVIDER_OPTIONS, canvasModels } from "./env";
import { assembleGif } from "./gif";
import { loadCanvasImage, storeCanvasImage } from "./image-storage";

export type NodeExecutor = (
  node: CanvasNode,
  inputs: CanvasOutput[],
  signal?: AbortSignal
) => Promise<CanvasOutput>;

export class CanvasNodeError extends Error {
  readonly nodeId: string;
  constructor(nodeId: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.nodeId = nodeId;
  }
}

export type CanvasFailureObserver = (
  error: CanvasNodeError,
  kind: CanvasNode["kind"]
) => void;

function reportFailure(
  observer: CanvasFailureObserver | undefined,
  error: CanvasNodeError,
  kind: CanvasNode["kind"]
) {
  try {
    observer?.(error, kind);
  } catch {
    // A logging failure must not replace the node failure.
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
  const resolvedInputs = await Promise.all(
    inputs.map(async (input) =>
      input.image
        ? { ...input, image: await loadCanvasImage(input.image, signal) }
        : input
    )
  );
  if (node.kind === "gif") {
    const images = resolvedInputs.flatMap((input) =>
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
  const count = node.resultCount ?? 1;
  const text = `${node.prompt}\nUpstream text:\n${resolvedInputs.flatMap((input) => (input.text ? [input.text] : [])).join("\n\n")}`;
  const images = await Promise.all(
    resolvedInputs
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
    await consumeResource("image_generation", count > 1 ? count : undefined);
    const result = await generateImage({
      model: models.image,
      n: count,
      prompt: images.length ? { text, images } : text,
      size: sizes[node.aspectRatio],
      providerOptions: { openai: { quality: "low" } },
      abortSignal: signal,
      maxRetries: 1,
    });
    if (count === 1) {
      return {
        image: `data:${result.image.mediaType};base64,${result.image.base64}`,
      };
    }
    if (result.images.length !== count) {
      throw new Error("生成图片数量与请求不一致。");
    }
    return {
      results: result.images.map((image, index) => ({
        label: `${node.label} ${index + 1}`,
        image: `data:${image.mediaType};base64,${image.base64}`,
      })),
    };
  }
  await consumeResource("text_generation");
  const result = await generateText({
    model: models.text,
    ...(count > 1
      ? {
          output: Output.object({
            schema: z.object({
              results: z
                .array(
                  z.object({
                    label: z.string().max(100),
                    text: z.string().min(1).max(50_000),
                  })
                )
                .length(count),
            }),
          }),
          system: `Produce exactly ${count} separate, self-contained results in prompt order. Each result has a short descriptive label and its complete text. Divide the requested deliverables across results; do not repeat all deliverables in every result.`,
        }
      : {}),
    providerOptions: CANVAS_TEXT_PROVIDER_OPTIONS,
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
  return count > 1 ? { results: result.output.results } : { text: result.text };
};

export const generateStoredNode: NodeExecutor = async (
  node,
  inputs,
  signal
) => {
  const result = await generateNode(node, inputs, signal);
  const stored = await Promise.all(
    outputItems(result).map(async (item) =>
      item.image
        ? { ...item, image: await storeCanvasImage(item.image, signal) }
        : item
    )
  );
  return result.results ? { results: stored } : (stored[0] ?? result);
};

export async function runGraph(
  input: CanvasGraph,
  target: string | undefined,
  execute: NodeExecutor = generateStoredNode,
  onProgress?: (graph: CanvasGraph, activeNode: string | null) => void,
  signal?: AbortSignal,
  onFailure?: CanvasFailureObserver
) {
  const graph = parseGraph(input);
  const order = executionOrder(graph, target);
  for (const id of order) {
    delete graph.errors[id];
  }
  onProgress?.(graph, null);
  function fail(error: CanvasNodeError): never {
    graph.errors[error.nodeId] = error.message;
    onProgress?.(graph, null);
    throw error;
  }
  for (const id of order) {
    const message = inputError(graph, requireNode(graph, id));
    if (message) {
      fail(new CanvasNodeError(id, message));
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
    try {
      const inputs = graph.edges
        .filter((edge) => edge.target === id)
        .flatMap((edge) => edgeInputs(graph, edge));
      graph.outputs[id] =
        materialOutput(graph, node) ?? (await execute(node, inputs, signal));
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }
      const message = publicNodeFailure(error, node.kind);
      const failure = new CanvasNodeError(id, message, { cause: error });
      reportFailure(onFailure, failure, node.kind);
      fail(failure);
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

function publicNodeFailure(error: unknown, kind: CanvasNode["kind"]) {
  if (error instanceof ResourceUsageDeniedError) {
    return error.details
      ? `生成额度不足：需要 ${error.details.requiredUnits} 点，当前剩余 ${error.details.remainingUnits} 点。已完成的结果已保留。`
      : error.message;
  }
  return kind === "gif"
    ? "GIF 合成失败，请检查上游是否为图片，以及网格行列设置。"
    : "生成失败，请检查模型配置或稍后重试。已完成的上游结果仍可复用。";
}
