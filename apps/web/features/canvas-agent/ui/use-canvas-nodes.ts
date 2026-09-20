"use client";
import type { Canvas } from "@workspace/ui/components/ai-elements/canvas";
import type { ComponentProps } from "react";
import {
  type CanvasNode,
  createNode,
  invalidateErrors,
  invalidateOutputs,
  parseGraph,
} from "../model/graph";
import {
  displayInputs,
  hasResult,
  nodeRunLabel,
  resultId,
  resultPosition,
  workflowId,
} from "../model/presentation";
import type { CanvasNodeData } from "./canvas-node";
import type { useCanvasAgent } from "./use-canvas-agent";

export function useCanvasNodes(
  c: ReturnType<typeof useCanvasAgent>,
  ready: boolean
) {
  const graph = c.graph;
  function update(id: string, patch: Partial<CanvasNode>) {
    c.edit({
      ...graph,
      nodes: graph.nodes.map((node) =>
        node.id === id ? { ...node, ...patch } : node
      ),
    });
  }
  async function upload(id: string, file: File) {
    if (
      file.size > 4 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/webp"].includes(file.type)
    ) {
      c.setNodeError(id, "请选择 4 MB 以内的 PNG、JPEG 或 WebP 图片。");
      return;
    }
    try {
      const data = await readImage(file);
      c.setGraph((current) =>
        parseGraph({
          ...current,
          assets: { ...current.assets, [id]: data },
          outputs: invalidateOutputs(current, [id]),
          errors: invalidateErrors(current, [id]),
          revision: current.revision + 1,
        })
      );
    } catch {
      c.setNodeError(id, "图片读取失败。");
    }
  }
  const baseNodes = graph.nodes.map((node) => ({
    id: workflowId(node.id),
    position: node.position,
    type: "workflow",
    data: {
      continueFrom: () => {
        const next = createNode("image", graph.nodes.length);
        const origin = hasResult(graph, node.id)
          ? resultPosition(node)
          : node.position;
        next.position = { x: origin.x + 420, y: origin.y };
        next.prompt = ["text", "prompt"].includes(node.kind)
          ? "根据上游文本生成一张图片，不添加文字。"
          : "以输入图片为参考，保留主体身份，修改场景和构图。";
        c.edit({
          nodes: [...graph.nodes, next],
          edges: [...graph.edges, { source: node.id, target: next.id }],
        });
      },
      node,
      error: graph.errors[node.id],
      output: graph.outputs[node.id],
      runLabel: nodeRunLabel(graph, node.id),
      asset: graph.assets[node.id],
      busy: c.busy,
      active: c.activeNode === node.id,
      update: (patch: Partial<CanvasNode>) => update(node.id, patch),
      remove: () =>
        c.edit({
          nodes: graph.nodes.filter((item) => item.id !== node.id),
          edges: graph.edges.filter(
            (edge) => edge.source !== node.id && edge.target !== node.id
          ),
        }),
      run: () => {
        if (ready) {
          return c.run(node.id);
        }
        c.setError("请配置 AI_GATEWAY_API_KEY 后运行。");
      },
      upload: (file: File) => upload(node.id, file),
    } satisfies CanvasNodeData,
  }));
  const nodes: NonNullable<ComponentProps<typeof Canvas>["nodes"]> =
    baseNodes.flatMap<
      NonNullable<ComponentProps<typeof Canvas>["nodes"]>[number]
    >((item) => {
      const node = item.data.node;
      if (node.kind === "output") {
        return [
          {
            ...item,
            type: "display",
            data: {
              label: node.label,
              busy: c.busy,
              remove: item.data.remove,
              items: displayInputs(graph, node.id),
            },
          },
        ];
      }
      const result = graph.outputs[node.id]?.image;
      return [
        item,
        ...(node.kind === "image" && result
          ? [
              {
                id: resultId(node.id),
                position: resultPosition(node),
                type: "result",
                deletable: false,
                data: {
                  label: node.label,
                  image: result,
                  busy: c.busy,
                  continueFrom: item.data.continueFrom,
                },
              },
            ]
          : []),
      ];
    });
  return nodes;
}

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
