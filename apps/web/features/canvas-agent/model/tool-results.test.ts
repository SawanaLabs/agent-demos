import { expect, it } from "vitest";
import { initialGraph } from "./graph";
import { workflowResults } from "./tool-results";

it("returns each completed result and reused dependency, excluding failed and unrelated results", () => {
  const graph = initialGraph();
  graph.outputs = {
    brief: { results: [{ text: "first" }, { text: "second" }] },
    visual: { image: "data:image/png;base64,YQ==" },
  };
  const results = workflowResults(graph, {
    completedNodeIds: ["brief"],
    reusedNodeIds: [],
  });
  expect(
    results.map((result) => [result.resultIndex, result.content.text])
  ).toEqual([
    [0, "first"],
    [1, "second"],
  ]);
  expect(results.every((result) => !result.reused)).toBe(true);
  const reused = workflowResults(graph, {
    completedNodeIds: [],
    reusedNodeIds: ["visual"],
  });
  expect(reused).toEqual([
    expect.objectContaining({
      nodeId: "visual",
      reused: true,
      content: graph.outputs.visual,
    }),
  ]);
});
