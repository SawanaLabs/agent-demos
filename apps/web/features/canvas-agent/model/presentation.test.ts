import { expect, it } from "vitest";
import { createNode, editGraph, initialGraph, parseGraph } from "./graph";
import {
  displayInputs,
  nodeRunLabel,
  originalId,
  presentationEdges,
  resultPosition,
} from "./presentation";

it.each([
  ["visual", { image: "data:image/png;base64,YQ==" }],
  ["brief", { text: "生成的中文提示词\n第二行" }],
] as const)("projects reusable %s results with their executable dependency and saved position", (id, output) => {
  const graph = initialGraph();
  graph.nodes.push({ ...createNode("image", 2), id: "next" });
  graph.edges.push({ source: id, target: "next" });
  graph.outputs[id] = output;
  graph.nodes = graph.nodes.map((node) => ({
    ...node,
    resultPosition: { x: 900, y: 300 },
  }));
  expect(presentationEdges(graph)).toContainEqual({
    id: `${id}->next`,
    source: `node:${id}`,
    target: "node:next",
  });
  expect(originalId(`result:${id}`)).toBe(id);
  expect(
    parseGraph(JSON.parse(JSON.stringify(graph))).nodes.map((node) =>
      resultPosition(node)
    )[1]
  ).toEqual({ x: 900, y: 300 });
  const edited = editGraph(graph, {
    ...graph,
    nodes: graph.nodes.map((node) =>
      node.id === "brief" ? { ...node, prompt: "Changed" } : node
    ),
  });
  expect(presentationEdges(edited)).toContainEqual({
    id: `${id}->next`,
    source: `node:${id}`,
    target: "node:next",
  });
  expect(
    presentationEdges(edited).some((edge) => edge.id === `generated:${id}`)
  ).toBe(true);
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
  graph.outputs.brief = { text: "Generated copy" };
  graph.edges = ["literal", "ref", "visual", "brief"].map((source) => ({
    source,
    target: "display",
  }));
  expect(displayInputs(graph, "display").map((item) => item.content)).toEqual([
    { text: "Exact text" },
    { image: graph.assets.ref },
    graph.outputs.visual,
    graph.outputs.brief,
  ]);
});

it("labels a node run according to available upstream results and materials", () => {
  const graph = initialGraph();
  expect(nodeRunLabel(graph, "brief")).toBe("运行此节点");
  expect(nodeRunLabel(graph, "visual")).toBe("运行到这里");
  graph.outputs.brief = { text: "Ready" };
  expect(nodeRunLabel(graph, "visual")).toBe("运行此节点");
  const edited = editGraph(graph, {
    ...graph,
    nodes: graph.nodes.map((node) => ({ ...node, prompt: "Changed" })),
  });
  expect(nodeRunLabel(edited, "visual")).toBe("运行到这里");
  const materialGraph = {
    ...initialGraph(),
    nodes: [
      { ...createNode("prompt", 0), id: "prompt", prompt: "A cup" },
      { ...createNode("image", 1), id: "image" },
    ],
    edges: [{ source: "prompt", target: "image" }],
  };
  expect(nodeRunLabel(materialGraph, "image")).toBe("运行此节点");
});

it("keeps selected result connections and slots stable before generation and after invalidation", () => {
  const graph = initialGraph();
  graph.nodes[0] = { ...createNode("text", 0), id: "brief", resultCount: 2 };
  graph.edges = [{ source: "brief", target: "visual", resultIndex: 1 }];
  const planned = presentationEdges(graph);
  expect(planned).toContainEqual({
    id: "brief->visual:1",
    source: "result:brief:output:1",
    target: "node:visual",
  });
  graph.outputs.brief = { results: [{ text: "Closeup" }, { text: "Poster" }] };
  expect(presentationEdges(graph)).toEqual(planned);
  const edited = editGraph(graph, {
    ...graph,
    nodes: graph.nodes.map((node) =>
      node.id === "brief" ? { ...node, prompt: "Changed" } : node
    ),
  });
  expect(edited.outputs).toEqual({});
  expect(presentationEdges(edited)).toEqual(planned);
});

it("keeps selected material inputs connected to the material node", () => {
  const graph = initialGraph();
  graph.nodes.push({ ...createNode("prompt", 2), id: "material" });
  graph.edges = [{ source: "material", target: "visual", resultIndex: 0 }];
  expect(presentationEdges(graph)).toContainEqual({
    id: "material->visual:0",
    source: "node:material",
    target: "node:visual",
  });
});
