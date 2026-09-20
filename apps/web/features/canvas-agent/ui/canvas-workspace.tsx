"use client";
import { Canvas } from "@workspace/ui/components/ai-elements/canvas";
import { Controls } from "@workspace/ui/components/ai-elements/controls";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { ControlButton } from "@xyflow/react";
import { LayoutDashboardIcon } from "lucide-react";
import { type ComponentProps, useEffect, useState } from "react";
import { connectNodes } from "../model/commands";
import { addCanvasNode } from "../model/generation";
import { type CanvasNode, createNode } from "../model/graph";
import { arrangeGraph } from "../model/layout";
import {
  originalId,
  presentationEdges,
  resultIndex,
} from "../model/presentation";
import { edgeId } from "../model/results";
import { CanvasChat } from "./canvas-chat";
import { CanvasEdgeView } from "./canvas-edge";
import { CanvasHeader } from "./canvas-header";
import { CanvasNodeView } from "./canvas-node";
import { CanvasOutputView } from "./canvas-output";
import { CanvasToolbar } from "./canvas-toolbar";
import { moveCanvasNodes } from "./flow-node-state";
import { useCanvasAgent } from "./use-canvas-agent";
import { useCanvasNodes } from "./use-canvas-nodes";

const nodeTypes = {
  workflow: CanvasNodeView,
  display: CanvasOutputView,
};
const edgeTypes = { connection: CanvasEdgeView };
type FlowInstance = Parameters<
  NonNullable<ComponentProps<typeof Canvas>["onInit"]>
>[0];

export function CanvasWorkspace({ ready }: { ready: boolean }) {
  const c = useCanvasAgent();
  const [flow, setFlow] = useState<FlowInstance | null>(null);
  const graph = c.graph;
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  function add(kind: CanvasNode["kind"]) {
    const node = createNode(kind, graph.nodes.length);
    if (flow) {
      node.position = flow.screenToFlowPosition({
        x: window.innerWidth * 0.32,
        y: window.innerHeight * 0.35,
      });
    }
    c.edit(addCanvasNode(graph, node).graph);
  }
  function arrange() {
    if (!flow || c.busy) {
      return;
    }
    try {
      c.edit(
        arrangeGraph(
          graph,
          nodes.map(({ id }) => ({
            id,
            measured: flow.getInternalNode(id)?.measured,
          }))
        )
      );
      setSelectedEdge(null);
      requestAnimationFrame(() => {
        void flow.fitView({ padding: 0.35, maxZoom: 0.85, duration: 300 });
      });
    } catch (error) {
      c.setError(error instanceof Error ? error.message : "整理画布失败。");
    }
  }
  const { nodes, onNodesChange } = useCanvasNodes(c, ready);
  useEffect(() => {
    if (
      c.layoutRequested &&
      !c.busy &&
      flow &&
      nodes.every((node) => node.measured?.width && node.measured.height)
    ) {
      arrange();
      c.finishLayout();
    }
  });
  return (
    <main className="fixed inset-0 z-40 flex flex-col bg-background font-sans">
      <CanvasHeader controller={c} ready={ready} />
      <div className="relative min-h-0 flex-1">
        <Canvas
          edges={presentationEdges(graph).map((edge) => ({
            ...edge,
            type:
              "deletable" in edge && edge.deletable === false
                ? "default"
                : "connection",
            data: {
              busy: c.busy,
              disconnect: () => {
                c.edit({
                  ...graph,
                  edges: graph.edges.filter((item) => edgeId(item) !== edge.id),
                });
                setSelectedEdge(null);
              },
            },
            selected: selectedEdge === edge.id,
            animated: c.busy && c.activeNode === originalId(edge.target),
          }))}
          edgeTypes={edgeTypes}
          fitViewOptions={{ padding: 0.35, maxZoom: 0.85 }}
          isValidConnection={({ source, target }) =>
            !target.startsWith("result:") &&
            (source.startsWith("result:") ||
              ["prompt", "reference"].includes(
                graph.nodes.find((node) => node.id === originalId(source))
                  ?.kind ?? ""
              )) &&
            originalId(source) !== originalId(target) &&
            !["reference", "prompt"].includes(
              graph.nodes.find((node) => node.id === originalId(target))
                ?.kind ?? ""
            )
          }
          minZoom={0.15}
          nodes={nodes}
          nodesConnectable={!c.busy}
          nodesDraggable={!c.busy}
          nodeTypes={nodeTypes}
          onConnect={({ source, target }) => {
            if (source && target) {
              try {
                c.edit(
                  connectNodes(
                    graph,
                    originalId(source),
                    originalId(target),
                    source.startsWith("result:")
                      ? resultIndex(source)
                      : undefined
                  )
                );
              } catch (error) {
                c.setError(
                  error instanceof Error ? error.message : "连接失败。"
                );
              }
            }
          }}
          onEdgeClick={(_, edge) =>
            setSelectedEdge(edge.deletable === false ? null : edge.id)
          }
          onEdgesDelete={(edges) =>
            c.edit({
              ...graph,
              edges: graph.edges.filter(
                (edge) => !edges.some((deleted) => deleted.id === edgeId(edge))
              ),
            })
          }
          onInit={setFlow}
          onNodesChange={(changes) => {
            onNodesChange(changes);
            if (c.busy) {
              return;
            }
            const removed = new Set(
              changes
                .filter((change) => change.type === "remove")
                .map((change) => originalId(change.id))
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
                nodes: moveCanvasNodes(current.nodes, moves),
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
          >
            <Tooltip>
              <TooltipTrigger
                render={
                  <ControlButton
                    aria-label="整理画布"
                    disabled={c.busy || !flow || graph.nodes.length === 0}
                    onClick={arrange}
                  />
                }
              >
                <LayoutDashboardIcon />
              </TooltipTrigger>
              <TooltipContent side="right">整理画布</TooltipContent>
            </Tooltip>
          </Controls>
        </Canvas>
        <CanvasToolbar add={add} busy={c.busy} />
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
