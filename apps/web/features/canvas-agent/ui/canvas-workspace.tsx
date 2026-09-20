"use client";
import { Canvas } from "@workspace/ui/components/ai-elements/canvas";
import { Controls } from "@workspace/ui/components/ai-elements/controls";
import { Button } from "@workspace/ui/components/button";
import { UnplugIcon } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { type CanvasNode, createNode } from "../model/graph";
import {
  originalId,
  presentationEdges,
  resultId,
  workflowId,
} from "../model/presentation";
import { CanvasChat } from "./canvas-chat";
import { CanvasHeader } from "./canvas-header";
import { CanvasNodeView } from "./canvas-node";
import { CanvasOutputView } from "./canvas-output";
import { CanvasResultView } from "./canvas-result";
import { CanvasToolbar } from "./canvas-toolbar";
import { useCanvasAgent } from "./use-canvas-agent";
import { useCanvasNodes } from "./use-canvas-nodes";

const nodeTypes = {
  workflow: CanvasNodeView,
  result: CanvasResultView,
  display: CanvasOutputView,
};
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
    c.edit({ ...graph, nodes: [...graph.nodes, node] });
  }
  const nodes = useCanvasNodes(c, ready);
  const connection = graph.edges.find(
    (edge) => `${edge.source}->${edge.target}` === selectedEdge
  );
  return (
    <main className="fixed inset-0 z-40 flex flex-col bg-background font-sans">
      <CanvasHeader controller={c} ready={ready} />
      <div className="relative min-h-0 flex-1">
        <Canvas
          edges={presentationEdges(graph).map((edge) => ({
            ...edge,
            selected: selectedEdge === edge.id,
            animated: c.busy && c.activeNode === originalId(edge.target),
          }))}
          fitViewOptions={{ padding: 0.35, maxZoom: 0.85 }}
          isValidConnection={({ source, target }) =>
            !target.startsWith("result:") &&
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
              c.edit({
                ...graph,
                edges: [
                  ...graph.edges,
                  { source: originalId(source), target: originalId(target) },
                ],
              });
            }
          }}
          onEdgeClick={(_, edge) =>
            setSelectedEdge(edge.deletable === false ? null : edge.id)
          }
          onEdgesDelete={(edges) =>
            c.edit({
              ...graph,
              edges: graph.edges.filter(
                (edge) =>
                  !edges.some(
                    (deleted) => deleted.id === `${edge.source}->${edge.target}`
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
                nodes: current.nodes.map((node) => {
                  const move = moves.find(
                    (change) => change.id === workflowId(node.id)
                  );
                  const resultMove = moves.find(
                    (change) => change.id === resultId(node.id)
                  );
                  return {
                    ...node,
                    ...(move?.position ? { position: move.position } : {}),
                    ...(resultMove?.position
                      ? { resultPosition: resultMove.position }
                      : {}),
                  };
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
        <CanvasToolbar add={add} busy={c.busy} />
        {connection ? (
          <div className="absolute top-28 left-16 flex max-w-[calc(100%-5rem)] items-center gap-2 rounded-lg border bg-background p-2 shadow-sm sm:top-16">
            <span className="truncate text-xs">
              {graph.nodes.find((node) => node.id === connection.source)?.label}{" "}
              →{" "}
              {graph.nodes.find((node) => node.id === connection.target)?.label}
            </span>
            <Button
              disabled={c.busy}
              onClick={() => {
                c.edit({
                  ...graph,
                  edges: graph.edges.filter((edge) => edge !== connection),
                });
                setSelectedEdge(null);
              }}
              size="sm"
              variant="outline"
            >
              <UnplugIcon className="size-4" />
              断开连线
            </Button>
          </div>
        ) : null}
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
