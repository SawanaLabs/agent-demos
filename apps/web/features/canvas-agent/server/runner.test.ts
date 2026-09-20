import { generateImage, generateText } from "ai";
import { afterEach, assert, expect, it, vi } from "vitest";
import { initialGraph } from "../model/graph";
import { generateNode, runGraph } from "./runner";

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

it("retains the provider cause on the server and exposes only a safe node error", async () => {
  const providerError = new Error("private-provider-detail");
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
  expect(JSON.stringify(snapshots)).not.toContain("private-provider-detail");
  expect(JSON.stringify(snapshots)).toContain("生成失败");
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
