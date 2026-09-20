import { assert, expect, it } from "vitest";
import { createNode, initialGraph, parseGraph } from "../model/graph";
import { handleCanvasChat } from "./handler";
import { generateStoredNode } from "./runner";

it("generates two structured text outputs through Agent tools and three native image outputs", async () => {
  if (process.env.CANVAS_GENERATION_INTEGRATION !== "1") {
    throw new Error(
      "Set CANVAS_GENERATION_INTEGRATION=1 to authorize real text and image generation."
    );
  }
  const response = await handleCanvasChat(
    new Request("http://localhost/chat", {
      method: "POST",
      body: JSON.stringify({
        graph: { ...initialGraph(), nodes: [], edges: [] },
        mode: "execute",
        messages: [
          {
            id: "request",
            role: "user",
            parts: [
              {
                type: "text",
                text: "创建一个生成文本节点，设置结果数量2，生成两份独立的柚子气泡水提示词：第一份产品特写，第二份户外海报，各80字以内。创建两个预览输出，分别只连接第一份与第二份文本结果，然后运行并整理画布。不要生成图片。",
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
  const snapshots = events.filter((event) => event.type === "data-canvas");
  assert(snapshots.length);
  const graph = parseGraph(snapshots.at(-1).data.graph);
  expect(graph.errors).toEqual({});
  const textNode = graph.nodes.find((node) => node.kind === "text");
  assert(textNode);
  expect(textNode.resultCount).toBe(2);
  expect(graph.outputs[textNode.id]?.results).toHaveLength(2);
  expect(
    graph.edges
      .filter((edge) => edge.source === textNode.id)
      .map((edge) => edge.resultIndex)
      .sort()
  ).toEqual([0, 1]);
  const imageNode = {
    ...createNode("image", 3),
    resultCount: 3,
    aspectRatio: "1:1" as const,
    prompt:
      "Minimal flat icon of a yellow lemon on a white background. No text.",
  };
  const images = await generateStoredNode(imageNode, []);
  expect(images.results).toHaveLength(3);
  for (const image of images.results ?? []) {
    expect(image.image).toMatch(
      /^https:\/\/.*\.public\.blob\.vercel-storage\.com\//
    );
  }
});
