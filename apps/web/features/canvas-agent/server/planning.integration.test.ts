import { assert, expect, it } from "vitest";
import { initialGraph, parseGraph } from "../model/graph";
import { handleCanvasChat } from "./handler";

it.each([
  {
    request:
      "创建一个生成文本节点，写两份分别可直接用于图片生成的柚子气泡水提示词，一份产品特写，一份户外海报。各自接入对应的生成图片节点。只编排，不生成。",
    count: 2,
    indices: [0, 1],
  },
  {
    request:
      "创建一个生成文本节点，写一份共享的柚子气泡水品牌创意 brief，把同一份完整 brief 同时交给产品特写和户外海报两个生成图片节点。只编排，不生成。",
    count: 1,
    indices: [undefined, undefined],
  },
])("plans independent versus shared text deliverables ($count)", async ({
  request,
  count,
  indices,
}) => {
  const response = await handleCanvasChat(
    new Request("http://localhost/chat", {
      method: "POST",
      body: JSON.stringify({
        graph: { ...initialGraph(), nodes: [], edges: [] },
        mode: "plan",
        messages: [
          {
            id: "request",
            role: "user",
            parts: [{ type: "text", text: request }],
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
  const snapshot = events
    .filter((event) => event.type === "data-canvas")
    .at(-1);
  assert(snapshot);
  const graph = parseGraph(snapshot.data.graph);
  const textNodes = graph.nodes.filter((node) => node.kind === "text");
  expect(textNodes).toHaveLength(1);
  const textNode = textNodes[0];
  assert(textNode);
  expect(textNode.resultCount ?? 1).toBe(count);
  const imageIds = graph.nodes
    .filter((node) => node.kind === "image")
    .map((node) => node.id);
  expect(imageIds).toHaveLength(2);
  expect(
    graph.edges
      .filter(
        (edge) => edge.source === textNode.id && imageIds.includes(edge.target)
      )
      .map((edge) => edge.resultIndex)
      .sort()
  ).toEqual(indices);
  expect(graph.outputs).toEqual({});
  expect(graph.nodes.filter((node) => node.kind === "output")).toHaveLength(0);
});
