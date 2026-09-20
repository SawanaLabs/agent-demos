import { assert, expect, it } from "vitest";
import { addCanvasNode, migrateGenerationInputs } from "./generation";
import { createNode, initialGraph } from "./graph";

it("creates a prompt input for an independent generator and reuses an existing result for continuation", () => {
  const empty = { ...initialGraph(), nodes: [], edges: [] };
  const text = { ...createNode("text", 0), prompt: "写一段广告文案" };
  const first = addCanvasNode(empty, text);
  expect(
    first.graph.nodes.find((n) => n.id === first.promptNodeId)?.prompt
  ).toBe("写一段广告文案");
  expect(first.graph.nodes.find((n) => n.id === text.id)?.prompt).toBe("");
  const image = createNode("image", 1);
  const next = addCanvasNode(first.graph, image, [
    { source: text.id, resultIndex: 0 },
  ]);
  expect(next.promptNodeId).toBeUndefined();
  expect(next.graph.nodes).toHaveLength(3);
  expect(next.graph.edges).toContainEqual({
    source: text.id,
    resultIndex: 0,
    target: image.id,
  });
});

it("migrates legacy instructions and all-result connections without losing completed work or duplicating prompts", () => {
  const old = initialGraph();
  const first = old.nodes[0];
  assert(first);
  first.resultCount = 2;
  old.outputs.brief = { results: [{ text: "第一份" }, { text: "第二份" }] };
  const next = migrateGenerationInputs(old);
  expect(next.outputs).toMatchObject(old.outputs);
  expect(
    next.nodes.filter((n) => n.kind === "prompt").map((n) => n.prompt)
  ).toEqual(old.nodes.map((n) => n.prompt));
  expect(
    next.edges.filter((e) => e.source === "brief").map((e) => e.resultIndex)
  ).toEqual([0, 1]);
  expect(migrateGenerationInputs(next)).toEqual(next);
});
