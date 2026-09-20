import { generateImage, generateText } from "ai";
import { afterEach, assert, expect, it, vi } from "vitest";
import {
  ResourceUsageDeniedError,
  withResourceUsage,
} from "@/features/shared/resource-usage/server/context";
import { initialGraph } from "../model/graph";
import { executionReport, generateNode, runGraph } from "./runner";

vi.mock("ai", async (original) => ({
  ...(await original<typeof import("ai")>()),
  generateImage: vi.fn(),
  generateText: vi.fn(),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

it.each([
  false,
  true,
])("uses GPT Image 2 low and preserves reference inputs: %s", async (withReference) => {
  vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
  vi.stubEnv("AI_GATEWAY_IMAGE_MODEL", "");
  vi.mocked(generateImage).mockResolvedValue({
    image: { mediaType: "image/png", base64: "b3V0" },
  } as Awaited<ReturnType<typeof generateImage>>);
  const reference = "data:image/png;base64,aW4=";
  const node = initialGraph().nodes[1];
  assert(node);
  const output = await generateNode(
    node,
    withReference ? [{ image: reference }] : []
  );
  const call = vi.mocked(generateImage).mock.calls[0]?.[0];
  assert(call);
  expect(call).toMatchObject({
    model: { modelId: "openai/gpt-image-2" },
    size: "1536x864",
    providerOptions: { openai: { quality: "low" } },
  });
  if (withReference) {
    expect(call.prompt).toMatchObject({ images: [reference] });
  } else {
    expect(typeof call.prompt).toBe("string");
  }
  expect(output.image).toBe("data:image/png;base64,b3V0");
});

it("preserves diagnostic errors while redacting credentials", async () => {
  const providerError = new Error("Connection failed: Bearer sk-private-token");
  const onFailure = vi.fn();
  const snapshots: unknown[] = [];
  await expect(
    runGraph(
      initialGraph(),
      "brief",
      () => {
        throw providerError;
      },
      (graph) => snapshots.push(structuredClone(graph)),
      undefined,
      onFailure
    )
  ).rejects.toMatchObject({ nodeId: "brief", cause: providerError });
  expect(onFailure).toHaveBeenCalledOnce();
  expect(onFailure).toHaveBeenCalledWith(
    expect.objectContaining({
      nodeId: "brief",
      cause: providerError,
    }),
    "text"
  );
  expect(JSON.stringify(snapshots)).not.toContain("sk-private-token");
  expect(JSON.stringify(snapshots)).toContain("Connection failed");
});

it("uses Luna medium for text nodes and respects the configured model", async () => {
  vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
  vi.mocked(generateText).mockResolvedValue({ text: "done" } as Awaited<
    ReturnType<typeof generateText>
  >);
  const node = initialGraph().nodes[0];
  assert(node);
  for (const model of ["", "openai/gpt-5-mini"]) {
    vi.stubEnv("AI_GATEWAY_CHAT_MODEL", model);
    expect(await generateNode(node, [])).toEqual({ text: "done" });
    expect(vi.mocked(generateText).mock.lastCall?.[0]).toMatchObject({
      model: { modelId: model || "openai/gpt-5.6-luna" },
      providerOptions: { openai: { reasoningEffort: "medium" } },
    });
  }
});

it("blocks image generation before the provider call when the host denies credits", async () => {
  vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
  const node = initialGraph().nodes[1];
  assert(node);
  const charge = vi.fn(async () => {
    throw new ResourceUsageDeniedError("Not enough demo credits.");
  });
  await expect(
    withResourceUsage(charge, () => generateNode(node, []))
  ).rejects.toThrow("Not enough demo credits.");
  expect(charge).toHaveBeenCalledWith("image_generation");
  expect(generateImage).not.toHaveBeenCalled();
});

it("requests a structured result list for multi-text while charging one text generation", async () => {
  vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
  const results = [
    { label: "产品", text: "Closeup" },
    { label: "海报", text: "Poster" },
  ];
  vi.mocked(generateText).mockResolvedValue({ output: { results } } as Awaited<
    ReturnType<typeof generateText>
  >);
  const node = initialGraph().nodes[0];
  assert(node);
  const charge = vi.fn(async () => undefined);
  expect(
    await withResourceUsage(charge, () =>
      generateNode({ ...node, resultCount: 2 }, [])
    )
  ).toEqual({ results });
  expect(vi.mocked(generateText).mock.lastCall?.[0]).toMatchObject({
    output: { name: "object" },
  });
  expect(charge).toHaveBeenCalledExactlyOnceWith("text_generation");
});

it("uses native image batching and reserves the entire batch before generation", async () => {
  vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
  vi.mocked(generateImage).mockResolvedValue({
    images: Array.from({ length: 3 }, () => ({
      mediaType: "image/png",
      base64: "YQ==",
    })),
  } as Awaited<ReturnType<typeof generateImage>>);
  const node = initialGraph().nodes[1];
  assert(node);
  const charge = vi.fn(async () => undefined);
  const output = await withResourceUsage(charge, () =>
    generateNode({ ...node, resultCount: 3 }, [])
  );
  expect(output.results).toHaveLength(3);
  expect(vi.mocked(generateImage).mock.lastCall?.[0]).toMatchObject({ n: 3 });
  expect(charge).toHaveBeenCalledExactlyOnceWith("image_generation", 3);
});

it("resumes after credits are replenished without rerunning completed upstream work", async () => {
  const graph = initialGraph();
  graph.outputs.brief = { text: "Existing approved brief" };
  graph.errors.visual = "Not enough credits";
  const execute = vi.fn(async () => ({ image: "data:image/png;base64,b2s=" }));
  const result = await runGraph(graph, undefined, execute);
  expect(execute.mock.calls).toHaveLength(1);
  expect(result.outputs.brief).toEqual(graph.outputs.brief);
  expect(result.outputs.visual?.image).toBeTruthy();
  expect(result.errors).toEqual({});
});

it("keeps previous output on failed regeneration, then invalidates only downstream results on success", async () => {
  const graph = initialGraph();
  const first = graph.nodes[0];
  assert(first);
  graph.nodes.push({ ...first, id: "independent" });
  graph.outputs = {
    brief: { text: "old brief" },
    visual: { image: "data:image/png;base64,b2xk" },
    independent: { text: "keep" },
  };
  let current = graph;
  const report = executionReport("regenerate");
  await expect(
    runGraph(
      graph,
      "brief",
      async () => {
        throw new Error("upstream timed out");
      },
      (next) => {
        current = next;
      },
      undefined,
      undefined,
      report
    )
  ).rejects.toThrow("upstream timed out");
  expect(current.outputs).toEqual(graph.outputs);
  expect(report.attemptedNodeIds).toEqual(["brief"]);
  expect(report.completedNodeIds).toEqual([]);
  const nextReport = executionReport("regenerate");
  const result = await runGraph(
    current,
    "brief",
    async () => ({ text: "new brief" }),
    undefined,
    undefined,
    undefined,
    nextReport
  );
  expect(result.outputs).toEqual({
    brief: { text: "new brief" },
    independent: { text: "keep" },
  });
  expect(nextReport.invalidatedNodeIds).toEqual(["visual"]);
});

it("passes each selected generated text verbatim to its image request through explicit inputs", async () => {
  const { addCanvasNode } = await import("../model/generation");
  const { createNode } = await import("../model/graph");
  vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
  vi.mocked(generateText).mockResolvedValue({
    output: {
      results: [
        { label: "特写", text: "完整的产品特写提示词" },
        { label: "海报", text: "完整的户外海报提示词" },
      ],
    },
  } as Awaited<ReturnType<typeof generateText>>);
  vi.mocked(generateImage).mockResolvedValue({
    image: { mediaType: "image/png", base64: "b3V0" },
  } as Awaited<ReturnType<typeof generateImage>>);
  const source = {
    ...createNode("text", 0),
    id: "source",
    resultCount: 2,
    prompt: "生成两个独立提示词",
  };
  let graph = addCanvasNode(
    { ...initialGraph(), nodes: [], edges: [] },
    source
  ).graph;
  for (const resultIndex of [0, 1]) {
    graph = addCanvasNode(graph, createNode("image", resultIndex + 1), [
      { source: source.id, resultIndex },
    ]).graph;
  }
  const completed = await runGraph(graph, undefined, generateNode);
  expect(
    vi.mocked(generateImage).mock.calls.map(([call]) => call.prompt)
  ).toEqual(["完整的产品特写提示词", "完整的户外海报提示词"]);
  expect(
    Object.values(completed.outputs).filter((output) => output.image)
  ).toHaveLength(2);
});

it("resumes a migrated completed workflow without regenerating existing results", async () => {
  const { migrateGenerationInputs } = await import("../model/generation");
  const graph = initialGraph();
  graph.outputs = {
    brief: { text: "保留原文" },
    visual: { image: "data:image/png;base64,b3V0" },
  };
  const execute = vi.fn();
  const completed = await runGraph(
    migrateGenerationInputs(graph),
    undefined,
    execute
  );
  expect(execute).not.toHaveBeenCalled();
  expect(completed.outputs).toMatchObject(graph.outputs);
});
