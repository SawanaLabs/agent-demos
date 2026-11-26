import { createGateway, embed, generateImage, generateText } from "ai";
import { expect, it, vi } from "vitest";
import { withOpenAIPlatform } from "./openai-platform";

it("sends OpenAI text, embeddings, and images directly while retaining other models on Gateway", async () => {
  const gateway = createGateway({ apiKey: "gateway-fixture" });
  const provider = withOpenAIPlatform(gateway, "openai-fixture");
  const requests = vi.fn((url: string, init: RequestInit) => {
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer openai-fixture"
    );

    switch (url) {
      case "https://api.openai.com/v1/responses":
        expect(JSON.parse(String(init.body)).model).toBe("gpt-5.6-luna");
        return Response.json({
          created_at: 1_770_000_000,
          id: "resp_test",
          model: "gpt-5.6-luna",
          output: [
            {
              content: [
                { annotations: [], text: "hello", type: "output_text" },
              ],
              id: "msg_123",
              role: "assistant",
              type: "message",
            },
          ],
          usage: { input_tokens: 1, output_tokens: 1 },
        });
      case "https://api.openai.com/v1/embeddings":
        expect(JSON.parse(String(init.body)).model).toBe(
          "text-embedding-3-small"
        );
        return Response.json({ data: [{ embedding: [0.1, 0.2] }] });
      case "https://api.openai.com/v1/images/generations":
        expect(JSON.parse(String(init.body)).model).toBe("gpt-image-2");
        return Response.json({ data: [{ b64_json: "aW1hZ2U=" }] });
      default:
        throw new Error(`Unexpected fetch to ${url}`);
    }
  });
  vi.stubGlobal("fetch", requests);
  try {
    const result = await generateText({
      maxRetries: 0,
      model: provider("openai/gpt-5.6-luna"),
      prompt: "Say hello.",
    });
    expect(result.text).toBe("hello");
    const embedding = await embed({
      maxRetries: 0,
      model: provider.embeddingModel("openai/text-embedding-3-small"),
      value: "hello",
    });
    expect(embedding.embedding).toEqual([0.1, 0.2]);
    const image = await generateImage({
      maxRetries: 0,
      model: provider.imageModel("openai/gpt-image-2"),
      prompt: "Draw a square.",
    });
    expect(image.image.base64).toBe("aW1hZ2U=");
    expect(provider("google/gemini-3.1-flash-lite").provider).toBe(
      gateway("google/gemini-3.1-flash-lite").provider
    );
    expect(requests).toHaveBeenCalledTimes(3);
  } finally {
    vi.unstubAllGlobals();
  }
});

it("requires a Platform key for every OpenAI model even when Gateway is configured", () => {
  const gateway = createGateway({ apiKey: "gateway-fixture" });
  const provider = withOpenAIPlatform(gateway, " ");
  expect(() => provider("openai/gpt-5-mini")).toThrow(/OPENAI_API_KEY/);
  expect(() => provider("gpt-5-mini")).toThrow(/OPENAI_API_KEY/);
  expect(() =>
    provider.embeddingModel("openai/text-embedding-3-small")
  ).toThrow(/OPENAI_API_KEY/);
  expect(() => provider.imageModel("openai/gpt-image-2")).toThrow(
    /OPENAI_API_KEY/
  );
  expect(provider("google/gemini-3.1-flash-lite").provider).toBe(
    gateway("google/gemini-3.1-flash-lite").provider
  );
});
