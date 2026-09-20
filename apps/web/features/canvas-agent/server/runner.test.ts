import { generateImage } from "ai";
import { afterEach, assert, expect, it, vi } from "vitest";
import { initialGraph } from "../model/graph";
import { generateNode } from "./runner";

vi.mock("ai", async (original) => ({
  ...(await original<typeof import("ai")>()),
  generateImage: vi.fn(),
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
