import { generateText } from "ai";
import { expect, it, vi } from "vitest";
import { createNode, initialGraph, parseGraph } from "../model/graph";
import { handleCanvasChat } from "./handler";

// Real Agent model and SDK loop; inject a deterministic node-provider failure.
vi.mock("ai", async (original) => ({
  ...(await original<typeof import("ai")>()),
  generateText: vi.fn(),
}));

it("reads a transient tool error, retries that node, then runs the next node in the same conversation turn", async () => {
  const first = {
    ...createNode("text", 0),
    id: "first",
    label: "第一段",
    prompt: "写一句夏日广告文案",
  };
  const second = {
    ...createNode("text", 1),
    id: "second",
    label: "第二段",
    prompt: "写一句冬日广告文案",
  };
  vi.mocked(generateText)
    .mockRejectedValueOnce(
      Object.assign(
        new Error(
          "Text service temporarily unavailable; retry this node once. Existing input is valid."
        ),
        { code: "ETIMEDOUT" }
      )
    )
    .mockResolvedValue({ text: "生成成功" } as Awaited<
      ReturnType<typeof generateText>
    >);
  const response = await handleCanvasChat(
    new Request("http://localhost/chat", {
      method: "POST",
      body: JSON.stringify({
        graph: { ...initialGraph(), nodes: [first, second], edges: [] },
        mode: "execute",
        messages: [
          {
            id: "request",
            role: "user",
            parts: [
              {
                type: "text",
                text: "请先单独运行第一段，收到结果后再单独运行第二段。若出现临时网络错误，允许对该节点重试一次。不要修改节点或提示词，不要一次运行整个工作流。",
              },
            ],
          },
        ],
      }),
    })
  );
  const events = (await response.text())
    .split("\n")
    .filter((line) => line.startsWith("data: {"))
    .map((line) => JSON.parse(line.slice(6)));
  expect(events.filter((event) => event.type === "error")).toEqual([]);
  const runs = events.filter(
    (event) => event.type === "tool-output-available" && event.output?.execution
  );
  expect(runs).toHaveLength(3);
  expect(runs[0].output).toMatchObject({
    failedNodeId: "first",
    failure: {
      error: {
        code: "ETIMEDOUT",
        message: expect.stringContaining("temporarily unavailable"),
      },
    },
  });
  expect(runs.map((event) => event.output.execution.attemptedNodeIds)).toEqual([
    ["first"],
    ["first"],
    ["second"],
  ]);
  const graph = parseGraph(
    events.filter((event) => event.type === "data-canvas").at(-1).data.graph
  );
  expect(graph.errors).toEqual({});
  expect(Object.keys(graph.outputs).sort()).toEqual(["first", "second"]);
  expect(events.some((event) => event.type === "text-delta")).toBe(true);
});

it("resumes from the same graph after an external credit top-up, retaining completed work", async () => {
  const { ResourceUsageDeniedError, withResourceUsage } = await import(
    "@/features/shared/resource-usage/server/context"
  );
  const brief = {
    ...createNode("text", 0),
    id: "brief",
    label: "已完成创意",
    prompt: "保留这份创意",
  };
  const next = {
    ...createNode("text", 1),
    id: "next",
    label: "待完成文案",
    prompt: "根据上游创意写一句文案",
  };
  const initial = {
    ...initialGraph(),
    nodes: [brief, next],
    edges: [{ source: brief.id, target: next.id }],
    outputs: { brief: { text: "用户已确认的原始创意" } },
  };
  let remaining = 0;
  vi.mocked(generateText)
    .mockReset()
    .mockResolvedValue({ text: "夏日清凉" } as Awaited<
      ReturnType<typeof generateText>
    >);
  async function chat(graph: unknown, messages: unknown[]) {
    const response = await withResourceUsage(
      async () => {
        if (!remaining) {
          throw new ResourceUsageDeniedError("需要1点，剩余0点", {
            requiredUnits: 1,
            remainingUnits: 0,
            resetAt: "2026-09-22T00:00:00.000Z",
          });
        }
        remaining -= 1;
      },
      () =>
        handleCanvasChat(
          new Request("http://localhost/chat", {
            method: "POST",
            body: JSON.stringify({ graph, mode: "execute", messages }),
          })
        )
    );
    return (await response.text())
      .split("\n")
      .filter((line) => line.startsWith("data: {"))
      .map((line) => JSON.parse(line.slice(6)));
  }
  const request = {
    id: "start",
    role: "user",
    parts: [
      {
        type: "text",
        text: "继续整个工作流未完成的部分，保留已完成创意。额度不足就停止并说明原因。",
      },
    ],
  };
  const first = await chat(initial, [request]);
  const denied = first.find(
    (event) =>
      event.type === "tool-output-available" &&
      event.output?.failure?.code === "resource_usage_denied"
  );
  expect(denied).toBeDefined();
  expect(vi.mocked(generateText)).not.toHaveBeenCalled();
  const graph = parseGraph(
    first.filter((event) => event.type === "data-canvas").at(-1).data.graph
  );
  remaining = 1; // External allowance change; the existing page graph and history stay intact.
  const call = first.find(
    (event) =>
      event.type === "tool-input-available" &&
      event.toolCallId === denied.toolCallId
  );
  const second = await chat(graph, [
    request,
    {
      id: "denied",
      role: "assistant",
      parts: [
        {
          type: "tool-runWorkflow",
          state: "output-available",
          toolCallId: denied.toolCallId,
          input: call.input,
          output: denied.output,
        },
      ],
    },
    {
      id: "recharged",
      role: "user",
      parts: [
        {
          type: "text",
          text: "我在另一个页面充值了，请重试，保留已完成创意。",
        },
      ],
    },
  ]);
  const completed = second.find(
    (event) => event.type === "tool-output-available" && event.output?.execution
  );
  expect(completed.output).toMatchObject({
    execution: {
      mode: "resume",
      reusedNodeIds: ["brief"],
      completedNodeIds: ["next"],
    },
  });
  const final = parseGraph(
    second.filter((event) => event.type === "data-canvas").at(-1).data.graph
  );
  expect(final.outputs.brief).toEqual(initial.outputs.brief);
  expect(final.outputs.next?.text).toBe("夏日清凉");
  expect(final.errors).toEqual({});
  expect(vi.mocked(generateText)).toHaveBeenCalledOnce();
  expect(remaining).toBe(0);
});
