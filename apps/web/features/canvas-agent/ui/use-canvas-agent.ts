"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import {
  type CanvasDefinition,
  type CanvasGraph,
  editGraph,
  initialGraph,
  parseGraph,
} from "../model/graph";

import { readRunStream } from "./run-stream";

export function useCanvasAgent() {
  const [graph, setGraph] = useState(initialGraph);
  const [mode, setMode] = useState<"plan" | "execute">("plan");
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
        prepareSendMessagesRequest: ({ messages }) => ({
          body: { messages, graph: graphRef.current, mode: modeRef.current },
        }),
      })
  );
  const chat = useChat({
    transport,
    onData: (part) => {
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
  busyRef.current = busy;
  useEffect(() => () => abort.current?.abort(), []);

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
  async function send(text: string) {
    if (busyRef.current || !text.trim()) {
      return;
    }
    busyRef.current = true;
    setError(null);
    chat.clearError();
    try {
      await chat.sendMessage({ text });
    } finally {
      busyRef.current = false;
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
        body: JSON.stringify({ graph: graphRef.current, target }),
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
    mode,
    setMode,
    activeNode,
    busy,
    error: error ?? chat.error?.message,
    setError,
    setNodeError: (id: string, message: string) =>
      setGraph((current) => ({
        ...current,
        errors: { ...current.errors, [id]: message },
      })),
    messages: chat.messages,
    status: chat.status,
    edit,
    send,
    run,
  };
}
