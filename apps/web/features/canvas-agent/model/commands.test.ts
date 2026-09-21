import { assert, expect, it } from "vitest";
import { connectNodes, disconnectNodes, updateNode } from "./commands";
import { initialGraph, parseGraph } from "./graph";

it("persists independent preview names without invalidating generated results", () => {
  const graph = initialGraph();
  graph.outputs = { brief: { text: "keep" } };
  const renamed = updateNode(graph, "brief", {
    resultLabels: { 0: "产品文案", 1: "海报提示词" },
  });
  const restored = parseGraph(JSON.parse(JSON.stringify(renamed)));
  expect(
    restored.nodes.find((node) => node.id === "brief")?.resultLabels
  ).toEqual({
    0: "产品文案",
    1: "海报提示词",
  });
  expect(restored.outputs).toEqual(graph.outputs);
  expect(restored.edges).toEqual(graph.edges);
});

it("preserves results on renames and invalidates only the edited branch", () => {
  const graph = initialGraph();
  const first = graph.nodes[0];
  assert(first);
  graph.nodes.push({ ...first, id: "other" });
  graph.outputs = {
    brief: { text: "prompt" },
    visual: { image: "data:image/png;base64,YQ==" },
    other: { text: "keep" },
  };
  const renamed = updateNode(graph, "visual", { label: "New title" });
  expect(renamed.outputs).toEqual(graph.outputs);
  const edited = updateNode(graph, "brief", { prompt: "new brief" });
  expect(edited.outputs).toEqual({ other: { text: "keep" } });
  expect(edited.nodes.find((node) => node.id === "visual")).toEqual(
    graph.nodes[1]
  );
  expect(graph.outputs.visual).toBeDefined();
});

it("edits one connection atomically and rejects a cycle without changing the graph", () => {
  const graph = initialGraph();
  graph.outputs = {
    brief: { text: "keep" },
    visual: { image: "data:image/png;base64,YQ==" },
  };
  const disconnected = disconnectNodes(graph, "brief", "visual");
  expect(disconnected.edges).toEqual([]);
  expect(disconnected.outputs).toEqual({ brief: { text: "keep" } });
  expect(connectNodes(disconnected, "brief", "visual").edges).toEqual(
    graph.edges
  );
  expect(connectNodes(graph, "brief", "visual").outputs).toEqual(graph.outputs);
  expect(() => connectNodes(graph, "visual", "brief")).toThrow("循环");
  expect(graph.edges).toEqual([{ source: "brief", target: "visual" }]);
});
