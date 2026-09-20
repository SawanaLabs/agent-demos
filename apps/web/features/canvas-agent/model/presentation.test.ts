import { expect, it } from "vitest";
import { createNode, editGraph, initialGraph, parseGraph } from "./graph";
import {
  displayInputs,
  originalId,
  presentationEdges,
  resultPosition,
} from "./presentation";

it("projects a reusable image result while retaining executable dependency and saved position", () => {
  const graph = initialGraph();
  graph.nodes.push({ ...createNode("image", 2), id: "next" });
  graph.edges.push({ source: "visual", target: "next" });
  graph.outputs.visual = { image: "data:image/png;base64,YQ==" };
  graph.nodes = graph.nodes.map((node) => ({
    ...node,
    resultPosition: { x: 900, y: 300 },
  }));
  expect(presentationEdges(graph)).toContainEqual({
    id: "visual->next",
    source: "result:visual",
    target: "node:next",
  });
  expect(originalId("result:visual")).toBe("visual");
  expect(
    parseGraph(JSON.parse(JSON.stringify(graph))).nodes.map(resultPosition)[1]
  ).toEqual({ x: 900, y: 300 });
  const edited = editGraph(graph, {
    ...graph,
    nodes: graph.nodes.map((node) =>
      node.id === "brief" ? { ...node, prompt: "Changed" } : node
    ),
  });
  expect(presentationEdges(edited)).toContainEqual({
    id: "visual->next",
    source: "node:visual",
    target: "node:next",
  });
  expect(
    presentationEdges(edited).some((edge) => edge.id === "generated:visual")
  ).toBe(false);
});

it("displays all connected materials immediately and generated results when available", () => {
  const graph = initialGraph();
  graph.nodes.push(
    { ...createNode("prompt", 2), id: "literal", prompt: "Exact text" },
    { ...createNode("reference", 3), id: "ref" },
    { ...createNode("output", 4), id: "display" }
  );
  graph.assets.ref = "data:image/png;base64,YQ==";
  graph.outputs.visual = { image: "data:image/png;base64,Yg==" };
  graph.edges = ["literal", "ref", "visual"].map((source) => ({
    source,
    target: "display",
  }));
  expect(displayInputs(graph, "display").map((item) => item.content)).toEqual([
    { text: "Exact text" },
    { image: graph.assets.ref },
    graph.outputs.visual,
  ]);
});
