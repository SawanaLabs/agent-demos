import { expect, it, vi } from "vitest";
import {
  ResourceUsageDeniedError,
  withResourceUsage,
} from "@/features/shared/resource-usage/server/context";
import { createNode, initialGraph } from "../model/graph";
import { handleCanvasChat } from "./handler";

const failures = vi.hoisted(() => [] as string[]);
vi.mock("ai", async (original) => {
  const actual = await original<typeof import("ai")>();
  return {
    ...actual,
    streamText: ((options: Parameters<typeof actual.streamText>[0]) =>
      actual.streamText({
        ...options,
        onError: ({ error }) => {
          failures.push(error instanceof Error ? error.message : String(error));
        },
      })) as typeof actual.streamText,
  };
});

it("continues the Agent conversation after a node is denied credits", async () => {
  const source = {
    ...createNode("prompt", 0),
    label: "已完成的创意",
    prompt: "清新的夏日饮品",
  };
  const node = {
    ...createNode("image", 0),
    label: "户外海报",
    prompt: "夏日柚子气泡水海报",
  };
  const response = await withResourceUsage(
    async () => {
      throw new ResourceUsageDeniedError(
        "图片生成需要 5 点额度，当前剩余 4 点。",
        {
          requiredUnits: 5,
          remainingUnits: 4,
          resetAt: "2026-09-22T00:00:00.000Z",
        }
      );
    },
    () =>
      handleCanvasChat(
        new Request("http://localhost/chat", {
          method: "POST",
          body: JSON.stringify({
            graph: {
              ...initialGraph(),
              nodes: [source, node],
              edges: [{ source: source.id, target: node.id }],
              outputs: { [source.id]: { text: source.prompt } },
            },
            mode: "execute",
            messages: [
              {
                id: "request",
                role: "user",
                parts: [
                  {
                    type: "text",
                    text: "请只运行户外海报节点，保留已完成的创意。如果工具失败，请解释原因。",
                  },
                ],
              },
            ],
          }),
        })
      )
  );
  const events = (await response.text())
    .split("\n")
    .filter((line) => line.startsWith("data: {"))
    .map((line) => JSON.parse(line.slice(6)));
  expect(failures).toEqual([]);
  expect(events.filter((event) => event.type === "error")).toEqual([]);
  const toolIndex = events.findIndex(
    (event) => event.type === "tool-output-available" && event.output?.error
  );
  expect(toolIndex).toBeGreaterThan(-1);
  expect(events[toolIndex].output).toMatchObject({
    failure: {
      code: "resource_usage_denied",
      requiredUnits: 5,
      remainingUnits: 4,
    },
    completedNodes: [{ id: source.id, label: source.label }],
  });
  const reply = events
    .slice(toolIndex + 1)
    .filter((event) => event.type === "text-delta")
    .map((event) => event.delta)
    .join("");
  expect(reply).toMatch(/额度|积分/);
});
