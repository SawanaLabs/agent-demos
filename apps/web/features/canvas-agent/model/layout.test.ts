import { expect, it } from "vitest";
import { createNode, editGraph, initialGraph } from "./graph";
import { arrangeGraph } from "./layout";
import {
  hasResult,
  presentationEdges,
  resultId,
  workflowId,
} from "./presentation";

it("arranges branches, results and disconnected nodes without changing workflow content", () => {
  const graph = initialGraph();
  graph.nodes.push(
    { ...createNode("image", 2), id: "branch" },
    { ...createNode("output", 3), id: "preview" },
    { ...createNode("prompt", 4), id: "loose", prompt: "Keep this" }
  );
  graph.edges.push(
    { source: "brief", target: "branch" },
    { source: "visual", target: "preview" },
    { source: "branch", target: "preview" }
  );
  graph.outputs.brief = { text: "A generated prompt" };
  graph.outputs.visual = { image: "data:image/png;base64,YQ==" };
  graph.errors.branch = "Existing error";
  const measured = graph.nodes.flatMap((node) => [
    {
      id: workflowId(node.id),
      measured: { width: 320, height: node.id === "preview" ? 900 : 350 },
    },
    ...(hasResult(graph, node.id)
      ? [{ id: resultId(node.id), measured: { width: 288, height: 420 } }]
      : []),
  ]);
  const snapshot = structuredClone(graph);
  const arranged = editGraph(graph, arrangeGraph(graph, measured));
  const positions = new Map(
    arranged.nodes.flatMap((node) => [
      [workflowId(node.id), node.position] as const,
      ...(node.resultPosition
        ? [[resultId(node.id), node.resultPosition] as const]
        : []),
    ])
  );
  function getPosition(id: string) {
    const position = positions.get(id);
    if (!position) {
      throw new Error(`Missing position: ${id}`);
    }
    return position;
  }
  const boxes = measured.map((node) => ({
    ...node.measured,
    ...getPosition(node.id),
  }));
  for (const [index, box] of boxes.entries()) {
    for (const other of boxes.slice(index + 1)) {
      expect(
        box.x + box.width <= other.x ||
          other.x + other.width <= box.x ||
          box.y + box.height <= other.y ||
          other.y + other.height <= box.y
      ).toBe(true);
    }
  }
  for (const edge of presentationEdges(arranged)) {
    expect(getPosition(edge.target).x).toBeGreaterThan(
      getPosition(edge.source).x
    );
  }
  expect(arranged.outputs).toEqual(graph.outputs);
  expect(arranged.errors).toEqual(graph.errors);
  expect(arranged.assets).toEqual(graph.assets);
  expect(arranged.edges).toEqual(graph.edges);
  expect(arranged.nodes.map((node) => node.prompt)).toEqual(
    graph.nodes.map((node) => node.prompt)
  );
  expect(arrangeGraph(arranged, measured).nodes).toEqual(arranged.nodes);
  expect(graph).toEqual(snapshot);
});
