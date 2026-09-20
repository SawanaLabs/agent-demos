import { expect, it } from "vitest";
import { createNode, initialGraph } from "./graph";
import { connectedInputs } from "./inputs";

it("describes connected inputs without mixing selected results or treating missing content as ready", () => {
  const graph = initialGraph();
  graph.nodes[0] = {
    ...createNode("text", 0),
    id: "brief",
    label: "广告创意",
    resultCount: 2,
  };
  graph.nodes.push({
    ...createNode("reference", 2),
    id: "ref",
    label: "产品参考",
  });
  graph.edges = [
    { source: "brief", target: "visual", resultIndex: 1 },
    { source: "ref", target: "visual" },
  ];
  expect(connectedInputs(graph, "visual")).toMatchObject([
    {
      label: "广告创意 · 结果 2",
      type: "text",
      ready: false,
      pending: "待生成",
    },
    { label: "产品参考", type: "image", ready: false, pending: "待输入" },
  ]);
  graph.outputs.brief = {
    results: [
      { label: "特写", text: "A" },
      { label: "海报", text: "B" },
    ],
  };
  graph.assets.ref = "data:image/png;base64,YQ==";
  expect(connectedInputs(graph, "visual")).toMatchObject([
    { label: "广告创意 · 海报", type: "text", ready: true },
    { label: "产品参考", type: "image", ready: true },
  ]);
  graph.edges = [];
  expect(connectedInputs(graph, "visual")).toEqual([]);
});
