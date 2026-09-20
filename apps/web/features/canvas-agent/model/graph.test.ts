import { describe, expect, it } from "vitest";
import { runGraph } from "../server/runner";
import { createNode, editGraph, executionOrder, initialGraph } from "./graph";

describe("canvas workflow contract", () => {
  it("passes generated upstream content into downstream generation", async () => {
    const calls: string[] = [];
    const result = await runGraph(initialGraph(), "visual", (node, inputs) => {
      calls.push(node.id);
      if (node.id === "brief") {
        return Promise.resolve({ text: "A grapefruit bottle in sunlight" });
      }
      expect(inputs).toEqual([{ text: "A grapefruit bottle in sunlight" }]);
      return Promise.resolve({ image: "data:image/png;base64,YQ==" });
    });
    expect(calls).toEqual(["brief", "visual"]);
    expect(result.outputs.visual?.image).toBe("data:image/png;base64,YQ==");
  });
  it("rejects cycles and invalidates stale results on edits", () => {
    const graph = initialGraph();
    expect(() =>
      executionOrder({
        ...graph,
        edges: [...graph.edges, { source: "visual", target: "brief" }],
      })
    ).toThrow("循环");
    graph.outputs.brief = { text: "Old prompt" };
    expect(
      editGraph(graph, {
        ...graph,
        nodes: graph.nodes.map((node) => ({ ...node, prompt: "Changed" })),
      }).outputs
    ).toEqual({});
  });
  it("preflights missing inputs before spending on generation", async () => {
    const graph = initialGraph();
    graph.nodes.push({ ...createNode("reference", 2), id: "ref" });
    graph.edges.push({ source: "ref", target: "visual" });
    let calls = 0;
    await expect(
      runGraph(graph, undefined, () => {
        calls += 1;
        return Promise.resolve({ text: "unexpected" });
      })
    ).rejects.toThrow("上传");
    expect(calls).toBe(0);
  });
  it("reuses an existing image when continuing to an edit node", async () => {
    const graph = initialGraph();
    graph.outputs = {
      brief: { text: "Original brief" },
      visual: { image: "data:image/png;base64,YQ==" },
    };
    const next = {
      ...createNode("image", 2),
      id: "edit",
      prompt: "Change the background",
    };
    const edited = editGraph(graph, {
      nodes: [...graph.nodes, next],
      edges: [...graph.edges, { source: "visual", target: "edit" }],
    });
    expect(edited.outputs.visual).toEqual(graph.outputs.visual);
    const calls: string[] = [];
    const result = await runGraph(edited, "edit", (node, inputs) => {
      calls.push(node.id);
      expect(inputs).toEqual([{ image: "data:image/png;base64,YQ==" }]);
      return Promise.resolve({ image: "data:image/png;base64,Yg==" });
    });
    expect(calls).toEqual(["edit"]);
    expect(result.outputs.visual).toEqual(graph.outputs.visual);
    expect(result.outputs.edit?.image).toBe("data:image/png;base64,Yg==");
  });
  it("invalidates descendants while preserving an independent branch", () => {
    const graph = initialGraph();
    graph.nodes.push({
      ...createNode("text", 2),
      id: "other",
      prompt: "Independent task",
    });
    graph.outputs = {
      brief: { text: "Old brief" },
      visual: { image: "data:image/png;base64,YQ==" },
      other: { text: "Independent result" },
    };
    const edited = editGraph(graph, {
      ...graph,
      nodes: graph.nodes.map((node) =>
        node.id === "brief" ? { ...node, prompt: "New brief" } : node
      ),
    });
    expect(edited.outputs).toEqual({ other: { text: "Independent result" } });
  });
});

it("publishes failure on the exact node, preserves upstream output, and clears it on retry", async () => {
  let latest = initialGraph();
  await expect(
    runGraph(
      latest,
      "visual",
      (node) => {
        if (node.id === "brief") {
          return Promise.resolve({ text: "Retained result" });
        }
        throw new Error("private provider failure");
      },
      (graph) => {
        latest = structuredClone(graph);
      }
    )
  ).rejects.toMatchObject({ nodeId: "visual" });
  expect(latest.errors.visual).toContain("private provider failure");
  expect(latest.errors.brief).toBeUndefined();
  expect(latest.outputs.brief?.text).toBe("Retained result");
  const edited = editGraph(latest, {
    ...latest,
    nodes: latest.nodes.map((node) => ({ ...node, prompt: "Updated prompt" })),
  });
  expect(edited.errors).toEqual({});
  const retried = await runGraph(latest, "visual", () =>
    Promise.resolve({ image: "data:image/png;base64,YQ==" })
  );
  expect(retried.errors).toEqual({});
  expect(retried.outputs.brief?.text).toBe("Retained result");
});

it("locates missing input errors before executing any node", async () => {
  const graph = initialGraph();
  graph.nodes = graph.nodes.map((node) =>
    node.id === "brief" ? { ...node, prompt: "" } : node
  );
  let latest = graph;
  await expect(
    runGraph(
      graph,
      undefined,
      () => {
        throw new Error("must not execute");
      },
      (next) => {
        latest = next;
      }
    )
  ).rejects.toMatchObject({ nodeId: "brief" });
  expect(latest.errors.brief).toContain("提示词");
  expect(latest.outputs).toEqual({});
});

it("merges literal text and image inputs without generating materials or displays", async () => {
  const graph = initialGraph();
  graph.nodes = [
    { ...createNode("prompt", 0), id: "prompt", prompt: "Make the cup blue" },
    { ...createNode("reference", 1), id: "ref" },
    { ...createNode("image", 2), id: "generate" },
    { ...createNode("output", 3), id: "display" },
  ];
  graph.edges = [
    { source: "prompt", target: "generate" },
    { source: "ref", target: "generate" },
    { source: "generate", target: "display" },
    { source: "prompt", target: "display" },
  ];
  graph.assets.ref = "data:image/png;base64,YQ==";
  const calls: string[] = [];
  const result = await runGraph(graph, undefined, (node, inputs) => {
    calls.push(node.id);
    expect(inputs).toEqual([
      { text: "Make the cup blue" },
      { image: graph.assets.ref },
    ]);
    return Promise.resolve({ image: "data:image/png;base64,Yg==" });
  });
  expect(calls).toEqual(["generate"]);
  expect(result.outputs.display).toEqual({});
  expect(() =>
    executionOrder({
      ...graph,
      edges: [...graph.edges, { source: "display", target: "generate" }],
    })
  ).toThrow("仅用于展示");
});
