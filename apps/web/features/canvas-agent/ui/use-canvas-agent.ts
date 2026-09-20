"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import {
  type CanvasDefinition,
  type CanvasGraph,
  editGraph,
  initialGraph,
  invalidateErrors,
  invalidateOutputs,
  parseGraph,
} from "../model/graph";

import { canvasChatError, canvasChatFetch } from "./chat-error";
import { storeGraphImages, uploadCanvasImage } from "./image-upload";
import { readRunStream } from "./run-stream";
import { useCanvasChatActions } from "./use-canvas-chat-actions";

export function useCanvasAgent() {
  const [graph, setGraph] = useState(initialGraph);
  const [mode, setMode] = useState<"plan" | "execute">("execute");
  const [layoutRequested, setLayoutRequested] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const graphRef = useRef(graph);
  const modeRef = useRef(mode);
  graphRef.current = graph;
  modeRef.current = mode;
  const busyRef = useRef(false);
  const abort = useRef<AbortController | null>(null);
  const [transport] = useState(
    () =>
      new DefaultChatTransport({
        api: "/api/demos/canvas-agent",
        fetch: canvasChatFetch,
        prepareSendMessagesRequest: async ({ messages }) => ({
          body: {
            messages,
            graph: await prepareGraph(),
            mode: modeRef.current,
          },
        }),
      })
  );
  const chat = useChat({
    transport,
    onData: (part) => {
      if (part.type === "data-canvas-layout") {
        setLayoutRequested(true);
      }
      if (part.type === "data-canvas") {
        const data = part.data as {
          graph: CanvasGraph;
          activeNode: string | null;
        };
        setGraph(parseGraph(data.graph));
        setActiveNode(data.activeNode);
      }
    },
    onFinish: () => setActiveNode(null),
    onError: () => setActiveNode(null),
  });
  const busy =
    running || chat.status === "submitted" || chat.status === "streaming";
  const actions = useCanvasChatActions(chat, busyRef, setError, () =>
    setActiveNode(null)
  );
  busyRef.current = busy;
  useEffect(() => () => abort.current?.abort(), []);

  async function prepareGraph() {
    const next = await storeGraphImages(graphRef.current);
    graphRef.current = next;
    setGraph(next);
    return next;
  }
  async function uploadAsset(id: string, file: File) {
    if (busyRef.current) {
      return;
    }
    busyRef.current = true;
    setRunning(true);
    try {
      const image = await uploadCanvasImage(file);
      setGraph((current) =>
        parseGraph({
          ...current,
          assets: { ...current.assets, [id]: image },
          outputs: invalidateOutputs(current, [id]),
          errors: invalidateErrors(current, [id]),
          revision: current.revision + 1,
        })
      );
    } catch {
      setGraph((current) => ({
        ...current,
        errors: {
          ...current.errors,
          [id]: "图片上传失败，请检查 Blob 配置、图片格式或上传额度。",
        },
      }));
    } finally {
      busyRef.current = false;
      setRunning(false);
    }
  }
  function edit(definition: CanvasDefinition) {
    if (busyRef.current) {
      return;
    }
    try {
      setGraph(editGraph(graphRef.current, definition));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "编辑失败。");
    }
  }
  async function run(target?: string) {
    if (busyRef.current) {
      return;
    }
    busyRef.current = true;
    setRunning(true);
    setError(null);
    abort.current = new AbortController();
    try {
      const response = await fetch("/api/demos/canvas-agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph: await prepareGraph(), target }),
        signal: abort.current.signal,
      });
      if (!(response.ok && response.body)) {
        throw new Error("工作流请求失败，请检查配置或使用额度。");
      }
      await readRunStream(response.body, (next, active) => {
        setGraph(next);
        setActiveNode(active);
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "运行失败。");
    } finally {
      setRunning(false);
      busyRef.current = false;
      setActiveNode(null);
    }
  }
  return {
    graph,
    setGraph,
    uploadAsset,
    layoutRequested,
    finishLayout: () => setLayoutRequested(false),
    newCanvas: () => {
      if (busyRef.current) {
        return;
      }
      setGraph({
        nodes: [],
        edges: [],
        outputs: {},
        assets: {},
        errors: {},
        revision: 0,
      });
      actions.reset();
      chat.setMessages([]);
      chat.clearError();
      setError(null);
      setLayoutRequested(false);
    },
    mode,
    setMode,
    activeNode,
    busy,
    error: error ?? canvasChatError(chat.error, chat.status),
    chatFailed: chat.status === "error",
    ...actions,
    setError,
    setNodeError: (id: string, message: string) =>
      setGraph((current) => ({
        ...current,
        errors: { ...current.errors, [id]: message },
      })),
    messages: chat.messages,
    status: chat.status,
    edit,
    run,
  };
}
