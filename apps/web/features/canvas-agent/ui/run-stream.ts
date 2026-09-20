import { type CanvasGraph, parseGraph } from "../model/graph";

interface RunEvent {
  activeNode: string | null;
  done?: boolean;
  error?: string;
  graph?: CanvasGraph;
}
export async function readRunStream(
  body: ReadableStream<Uint8Array>,
  update: (graph: CanvasGraph, active: string | null) => void
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let completed = false;
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) {
        break;
      }
      buffer += decoder.decode(chunk.value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const event = JSON.parse(line) as RunEvent;
        if (event.error) {
          throw new Error(event.error);
        }
        if (event.graph) {
          update(parseGraph(event.graph), event.activeNode);
        }
        completed ||= Boolean(event.done);
      }
    }
    if (!completed) {
      throw new Error("连接中断，工作流尚未完成。请重新运行。");
    }
  } finally {
    await reader.cancel();
  }
}
