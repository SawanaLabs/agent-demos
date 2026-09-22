"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { emptyCanvas } from "../model/empty-canvas";
import { migrateGenerationInputs } from "../model/generation";
import { parseGraph } from "../model/graph";
import type { useCanvasAgent } from "./use-canvas-agent";

export function useWorkflowFile(c: ReturnType<typeof useCanvasAgent>) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState<{
    message: string;
    resolve: (confirmed: boolean) => void;
  } | null>(null);
  const [baseline, setBaseline] = useState(() => JSON.stringify(c.graph));
  const [name, setName] = useState("未命名工作流");
  const [pending, setPending] = useState(false);
  const current = useRef(c);
  current.current = c;
  const dirty = JSON.stringify(c.graph) !== baseline;
  useEffect(() => {
    if (!dirty) {
      return;
    }
    const beforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);
  function confirm(message: string) {
    return new Promise<boolean>((resolve) =>
      setConfirmation({ message, resolve })
    );
  }
  function closeConfirmation(confirmed: boolean) {
    confirmation?.resolve(confirmed);
    setConfirmation(null);
  }
  async function mayLeave() {
    return (
      !dirty ||
      (await confirm("当前画布有未保存的修改。继续将离开当前工作流。"))
    );
  }
  async function navigate(href: string) {
    if (await mayLeave()) {
      router.push(href);
    }
  }
  function save() {
    const snapshot = JSON.stringify(c.graph);
    const url = URL.createObjectURL(
      new Blob([snapshot], { type: "application/json" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setBaseline(snapshot);
  }
  async function load(file: File) {
    if (c.busy || pending || !(await mayLeave())) {
      return;
    }
    setPending(true);
    const before = JSON.stringify(c.graph);
    try {
      if (file.size > 32 * 1024 * 1024) {
        throw new Error("工作流文件不能超过 32 MB。");
      }
      const graph = migrateGenerationInputs(
        parseGraph(JSON.parse(await file.text()))
      );
      if (
        current.current.busy ||
        JSON.stringify(current.current.graph) !== before
      ) {
        throw new Error("读取期间画布已修改，请重新打开工作流。");
      }
      c.newCanvas();
      c.setGraph(graph);
      setName(file.name.replace(/\.json$/i, ""));
      setBaseline(JSON.stringify(graph));
    } catch (cause) {
      c.setError(
        cause instanceof Error ? cause.message : "无法打开工作流文件。"
      );
    } finally {
      setPending(false);
    }
  }
  async function newCanvas() {
    if (c.busy || pending) {
      return;
    }
    if (
      !(await confirm(
        "新建画布将清空当前节点和对话。请先保存需要保留的工作流。继续吗？"
      ))
    ) {
      return;
    }
    c.newCanvas();
    setName("未命名工作流");
    setBaseline(JSON.stringify(emptyCanvas()));
  }
  return {
    name,
    dirty,
    busy: c.busy || pending,
    navigate,
    confirmation,
    closeConfirmation,
    save,
    load,
    newCanvas,
  };
}
