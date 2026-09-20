"use client";
import { Canvas } from "@workspace/ui/components/ai-elements/canvas";
import { Controls } from "@workspace/ui/components/ai-elements/controls";
import { Button } from "@workspace/ui/components/button";
import { ImageIcon, PlusIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";
import {
  type CanvasNode,
  createNode,
  invalidateErrors,
  invalidateOutputs,
  parseGraph,
} from "../model/graph";
import { CanvasChat } from "./canvas-chat";
import { CanvasHeader } from "./canvas-header";
import { type CanvasNodeData, CanvasNodeView } from "./canvas-node";
import { useCanvasAgent } from "./use-canvas-agent";

const nodeTypes = { workflow: CanvasNodeView };
type FlowInstance = Parameters<
  NonNullable<ComponentProps<typeof Canvas>["onInit"]>
>[0];

export function CanvasWorkspace({ ready }: { ready: boolean }) {
  const c = useCanvasAgent();
  const [flow, setFlow] = useState<FlowInstance | null>(null);
  const graph = c.graph;
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  function update(id: string, patch: Partial<CanvasNode>) {
    c.edit({
      ...graph,
      nodes: graph.nodes.map((node) =>
        node.id === id ? { ...node, ...patch } : node
      ),
    });
  }
  function add(kind: CanvasNode["kind"]) {
    const node = createNode(kind, graph.nodes.length);
    if (flow) {
      node.position = flow.screenToFlowPosition({
        x: window.innerWidth * 0.32,
        y: window.innerHeight * 0.35,
      });
    }
    c.edit({ ...graph, nodes: [...graph.nodes, node] });
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
  const nodes = graph.nodes.map((node) => ({
    id: node.id,
    position: node.position,
    type: "workflow",
    data: {
      continueFrom: () => {
        const next = createNode("image", graph.nodes.length);
        next.position = { x: node.position.x + 420, y: node.position.y };
        next.prompt =
          node.kind === "text"
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
          void c.run(node.id);
        } else {
          c.setError("请配置 AI_GATEWAY_API_KEY 后运行。");
        }
      },
      upload: (file: File) => {
        void upload(node.id, file);
      },
    } satisfies CanvasNodeData,
  }));
  return (
    <main className="fixed inset-0 z-40 flex flex-col bg-background font-sans">
      <CanvasHeader controller={c} ready={ready} />
      <div className="relative min-h-0 flex-1">
        <Canvas
          edges={graph.edges.map((edge) => ({
            ...edge,
            id: `${edge.source}->${edge.target}`,
            selected: selectedEdge === `${edge.source}->${edge.target}`,
            animated: c.busy && c.activeNode === edge.target,
          }))}
          fitViewOptions={{ padding: 0.35, maxZoom: 0.85 }}
          minZoom={0.15}
          nodes={nodes}
          nodesConnectable={!c.busy}
          nodesDraggable={!c.busy}
          nodeTypes={nodeTypes}
          onConnect={({ source, target }) => {
            if (source && target) {
              c.edit({ ...graph, edges: [...graph.edges, { source, target }] });
            }
          }}
          onEdgeClick={(_, edge) => setSelectedEdge(edge.id)}
          onEdgesDelete={(edges) =>
            c.edit({
              ...graph,
              edges: graph.edges.filter(
                (edge) =>
                  !edges.some(
                    (deleted) =>
                      deleted.source === edge.source &&
                      deleted.target === edge.target
                  )
              ),
            })
          }
          onInit={setFlow}
          onNodesChange={(changes) => {
            if (c.busy) {
              return;
            }
            const removed = new Set(
              changes
                .filter((change) => change.type === "remove")
                .map((change) => change.id)
            );
            if (removed.size) {
              c.edit({
                nodes: graph.nodes.filter((node) => !removed.has(node.id)),
                edges: graph.edges.filter(
                  (edge) =>
                    !(removed.has(edge.source) || removed.has(edge.target))
                ),
              });
              return;
            }
            const moves = changes.filter(
              (change) => change.type === "position"
            );
            if (moves.length) {
              c.setGraph((current) => ({
                ...current,
                nodes: current.nodes.map((node) => {
                  const move = moves.find((change) => change.id === node.id);
                  return move?.position
                    ? { ...node, position: move.position }
                    : node;
                }),
              }));
            }
          }}
          onPaneClick={() => setSelectedEdge(null)}
          panOnDrag
          selectionOnDrag={false}
        >
          <Controls
            fitViewOptions={{ padding: 0.35, maxZoom: 0.85 }}
            position="top-left"
          />
        </Canvas>
        <div className="absolute top-3 left-16 flex max-w-[calc(100%-5rem)] flex-wrap gap-1 rounded-lg border bg-background p-1 shadow-sm">
          <Button
            disabled={c.busy}
            onClick={() => add("text")}
            size="sm"
            variant="ghost"
          >
            <PlusIcon className="size-4" />
            文本
          </Button>
          <Button
            disabled={c.busy}
            onClick={() => add("image")}
            size="sm"
            variant="ghost"
          >
            <PlusIcon className="size-4" />
            图片
          </Button>
          <Button
            disabled={c.busy}
            onClick={() => add("reference")}
            size="sm"
            variant="ghost"
          >
            <ImageIcon className="size-4" />
            参考图
          </Button>
        </div>
        <p className="absolute bottom-5 left-5 hidden text-muted-foreground text-xs lg:block">
          拖动画布平移 · 双指缩放 · 拖动节点圆点连线
          <br />
          {graph.nodes.length} 个节点 / {graph.edges.length} 条连线 ·
          刷新前请保存文件
        </p>
        <CanvasChat controller={c} ready={ready} />
      </div>
    </main>
  );
}

function readImage(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
