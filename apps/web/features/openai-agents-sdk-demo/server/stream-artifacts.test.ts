import { describe, expect, it } from "vitest";

import { getOpenAiAgentsSdkDemoArtifactChunks } from "./stream-artifacts";

describe("openai agents sdk demo stream artifacts", () => {
  it("converts completed image-generation run items into file chunks", () => {
    expect(
      getOpenAiAgentsSdkDemoArtifactChunks({
        newItems: [
          {
            rawItem: {
              id: "ig_123",
              result: "ZmFrZS1pbWFnZQ==",
              status: "completed",
              type: "image_generation_call",
            },
          } as never,
        ],
        rawResponses: [],
      })
    ).toEqual([
      {
        mediaType: "image/png",
        type: "file",
        url: "data:image/png;base64,ZmFrZS1pbWFnZQ==",
      },
    ]);
  });

  it("falls back to raw responses when the base AI SDK bridge does not surface image files", () => {
    expect(
      getOpenAiAgentsSdkDemoArtifactChunks({
        newItems: [],
        rawResponses: [
          {
            output: [
              {
                id: "ig_456",
                result: "bW9yZS1pbWFnZQ==",
                status: "completed",
                type: "image_generation_call",
              },
            ],
          } as never,
        ],
      })
    ).toEqual([
      {
        mediaType: "image/png",
        type: "file",
        url: "data:image/png;base64,bW9yZS1pbWFnZQ==",
      },
    ]);
  });
});
