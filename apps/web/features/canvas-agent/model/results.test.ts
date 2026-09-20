import { assert, expect, it } from "vitest";
import { runGraph } from "../server/runner";
import { connectNodes, updateNode } from "./commands";
import { createNode, initialGraph, parseGraph } from "./graph";
import { arrangeGraph } from "./layout";
import {
  displayInputs,
  originalId,
  presentationEdges,
  resultId,
  resultIndex,
} from "./presentation";

it("round-trips multiple outputs and routes only the selected result downstream", async () => {
  const graph = initialGraph();
  assert(graph.nodes[0]);
  graph.nodes[0] = { ...graph.nodes[0], resultCount: 2 };
  graph.nodes.push({ ...createNode("output", 2), id: "preview" });
  graph.edges = [
    { source: "brief", target: "visual", resultIndex: 1 },
    { source: "brief", target: "preview", resultIndex: 0 },
  ];
  graph.outputs.brief = {
    results: [
      { label: "产品特写", text: "Closeup" },
      { label: "户外海报", text: "Poster" },
    ],
  };
  const saved = parseGraph(JSON.parse(JSON.stringify(graph)));
  await runGraph(saved, "visual", async (_, inputs) => {
    expect(inputs).toEqual([{ label: "户外海报", text: "Poster" }]);
    return { image: "data:image/png;base64,YQ==" };
  });
  expect(
    displayInputs(saved, "preview").map((item) => item.content.text)
  ).toEqual(["Closeup"]);
  expect(presentationEdges(saved)).toContainEqual({
    id: "brief->visual:1",
    source: "result:brief:output:1",
    target: "node:visual",
  });
  expect(originalId(resultId("brief", 1))).toBe("brief");
  expect(resultIndex(resultId("brief", 1))).toBe(1);
  const ids = [
    "node:brief",
    "node:visual",
    "result:visual",
    "node:preview",
    "result:brief",
    "result:brief:output:1",
  ];
  const arranged = arrangeGraph(
    saved,
    ids.map((id) => ({ id, measured: { width: 320, height: 420 } }))
  );
  expect(arranged.nodes[0]?.resultPositions?.[1]).toBeDefined();
  expect(arranged.nodes[0]?.resultPosition).not.toEqual(
    arranged.nodes[0]?.resultPositions?.[1]
  );
});

it("preserves old outputs, invalidates count changes, and rejects dangling result connections", () => {
  const graph = initialGraph();
  graph.outputs = {
    brief: { text: "old" },
    visual: { image: "data:image/png;base64,YQ==" },
  };
  const changed = updateNode(graph, "brief", { resultCount: 2 });
  expect(changed.outputs).toEqual({});
  expect(parseGraph(JSON.parse(JSON.stringify(graph))).outputs).toEqual(
    graph.outputs
  );
  const connected = connectNodes(changed, "brief", "visual", 1);
  expect(() => updateNode(connected, "brief", { resultCount: 1 })).toThrow(
    "结果编号"
  );
});
