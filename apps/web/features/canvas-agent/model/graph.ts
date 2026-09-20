import { z } from "zod";

const imageSchema = z
  .string()
  .max(8_000_000)
  .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/);
export const nodeSchema = z.object({
  id: z.string().min(1).max(80),
  kind: z.enum(["text", "image", "reference", "prompt", "output"]),
  label: z.string().min(1).max(100),
  prompt: z.string().max(12_000),
  aspectRatio: z.enum(["1:1", "16:9", "9:16"]),
  resultPosition: z
    .object({ x: z.number().finite(), y: z.number().finite() })
    .optional(),
  position: z.object({ x: z.number().finite(), y: z.number().finite() }),
});
export const definitionSchema = z.object({
  nodes: z.array(nodeSchema).max(20),
  edges: z.array(z.object({ source: z.string(), target: z.string() })).max(60),
});
export const outputSchema = z.object({
  text: z.string().max(50_000).optional(),
  image: imageSchema.optional(),
});
export const graphSchema = definitionSchema.extend({
  errors: z.record(z.string(), z.string()).default({}),
  revision: z.number().int().nonnegative(),
  assets: z.record(z.string(), imageSchema),
  outputs: z.record(z.string(), outputSchema),
});
export type CanvasNode = z.infer<typeof nodeSchema>;
export type CanvasDefinition = z.infer<typeof definitionSchema>;
export type CanvasGraph = z.infer<typeof graphSchema>;
export type CanvasOutput = z.infer<typeof outputSchema>;

export function executionOrder(
  graph: CanvasDefinition,
  target?: string
): string[] {
  const ids = new Set(graph.nodes.map((node) => node.id));
  if (ids.size !== graph.nodes.length) {
    throw new Error("节点 ID 不能重复。");
  }
  const edges = new Set<string>();
  for (const edge of graph.edges) {
    const key = `${edge.source}->${edge.target}`;
    if (!(ids.has(edge.source) && ids.has(edge.target)) || edges.has(key)) {
      throw new Error("连线无效或重复。");
    }
    if (
      ["reference", "prompt"].includes(
        graph.nodes.find((node) => node.id === edge.target)?.kind ?? ""
      )
    ) {
      throw new Error("素材节点不能接收输入。");
    }
    if (
      graph.nodes.find((node) => node.id === edge.source)?.kind === "output"
    ) {
      throw new Error("输出节点仅用于展示，请从原始素材或生成结果继续连线。");
    }
    edges.add(key);
  }
  const visited = new Set<string>();
  const active = new Set<string>();
  const order: string[] = [];
  function visit(id: string) {
    if (active.has(id)) {
      throw new Error("工作流不能包含循环连线。");
    }
    if (visited.has(id)) {
      return;
    }
    active.add(id);
    for (const edge of graph.edges.filter((item) => item.target === id)) {
      visit(edge.source);
    }
    active.delete(id);
    visited.add(id);
    order.push(id);
  }
  for (const id of ids) {
    visit(id);
  }
  if (!target) {
    return order;
  }
  if (!ids.has(target)) {
    throw new Error("运行节点不存在。");
  }
  visited.clear();
  active.clear();
  order.length = 0;
  visit(target);
  return order;
}

export function parseGraph(value: unknown): CanvasGraph {
  const graph = graphSchema.parse(value);
  executionOrder(graph);
  return graph;
}

export function editGraph(
  graph: CanvasGraph,
  definition: CanvasDefinition
): CanvasGraph {
  const next = definitionSchema.parse(definition);
  executionOrder(next);
  const assets = Object.fromEntries(
    Object.entries(graph.assets).filter(([id]) =>
      next.nodes.some((node) => node.id === id && node.kind === "reference")
    )
  );
  const changed = next.nodes
    .filter((node) => {
      const previous = graph.nodes.find((item) => item.id === node.id);
      const sources = (definition: CanvasDefinition) =>
        definition.edges
          .filter((edge) => edge.target === node.id)
          .map((edge) => edge.source)
          .sort()
          .join("|");
      return (
        !previous ||
        node.kind !== previous.kind ||
        node.prompt !== previous.prompt ||
        node.aspectRatio !== previous.aspectRatio ||
        sources(graph) !== sources(next)
      );
    })
    .map((node) => node.id);
  const outputs = invalidateOutputs({ ...graph, ...next }, changed);
  return {
    ...next,
    assets,
    outputs,
    errors: invalidateErrors({ ...graph, ...next }, changed),
    revision: graph.revision + 1,
  };
}

export function createNode(
  kind: CanvasNode["kind"],
  index: number
): CanvasNode {
  return {
    id: crypto.randomUUID(),
    kind,
    label: {
      text: "生成文本",
      image: "生成图片",
      reference: "图片素材",
      prompt: "文本素材",
      output: "预览输出",
    }[kind],
    prompt: "",
    aspectRatio: "16:9",
    position: {
      x: 80 + (index % 3) * 380,
      y: 80 + Math.floor(index / 3) * 380,
    },
  };
}

export function initialGraph(): CanvasGraph {
  return {
    revision: 0,
    errors: {},
    assets: {},
    outputs: {},
    nodes: [
      {
        id: "brief",
        kind: "text",
        label: "创意与提示词",
        prompt:
          "为一款柚子气泡水写一段中文产品摄影提示词。包含透明玻璃瓶、柚子切片、水珠和午后自然光。只输出提示词。",
        aspectRatio: "16:9",
        position: { x: 80, y: 140 },
      },
      {
        id: "visual",
        kind: "image",
        label: "产品画面",
        prompt: "根据上游提示词生成产品摄影，构图干净，不添加文字。",
        aspectRatio: "16:9",
        position: { x: 500, y: 140 },
      },
    ],
    edges: [{ source: "brief", target: "visual" }],
  };
}

export function invalidateOutputs(graph: CanvasGraph, ids: string[]) {
  return retainValidEntries(graph, graph.outputs, ids);
}

export function invalidateErrors(graph: CanvasGraph, ids: string[]) {
  return retainValidEntries(graph, graph.errors, ids);
}

function retainValidEntries<T>(
  graph: CanvasGraph,
  entries: Record<string, T>,
  ids: string[]
) {
  const invalid = new Set(ids);
  for (const id of executionOrder(graph)) {
    if (
      graph.edges.some((edge) => edge.target === id && invalid.has(edge.source))
    ) {
      invalid.add(id);
    }
  }
  return Object.fromEntries(
    Object.entries(entries).filter(
      ([id]) => !invalid.has(id) && graph.nodes.some((node) => node.id === id)
    )
  );
}

export function materialOutput(
  graph: CanvasGraph,
  node: CanvasNode
): CanvasOutput | undefined {
  if (node.kind === "reference") {
    return { image: graph.assets[node.id] };
  }
  if (node.kind === "prompt") {
    return { text: node.prompt };
  }
  if (node.kind === "output") {
    return {};
  }
  return;
}
