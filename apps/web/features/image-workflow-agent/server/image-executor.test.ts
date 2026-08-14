import { describe, expect, it, vi } from "vitest";

import { executeImageWorkflowRunPlan } from "./image-executor";

describe("image workflow execution adapter", () => {
  it("uses the configured image model and converts the first generated image to a data URL", async () => {
    const gateway = {
      languageModel: vi.fn((modelId: string) => `language-model:${modelId}`),
    };
    const generateTextMock = vi.fn().mockResolvedValue({
      files: [
        {
          base64: "aW1hZ2U=",
          mediaType: "image/png",
        },
      ],
    });

    await expect(
      executeImageWorkflowRunPlan(
        {
          aspectRatio: "16:9",
          imageModel: "google/gemini-3.1-flash-lite-image",
          prompt: "Turn this into a cinematic launch visual",
          referenceImage: {
            dataUrl: "data:image/png;base64,cmVm",
            filename: "reference.png",
            mediaType: "image/png",
            sizeBytes: 10,
          },
          resultNodeId: "result-1",
          revision: 3,
        },
        { AI_GATEWAY_API_KEY: "test-key" },
        {
          createGateway: () => gateway as never,
          generateText: generateTextMock,
        }
      )
    ).resolves.toEqual({
      dataUrl: "data:image/png;base64,aW1hZ2U=",
      mediaType: "image/png",
    });

    expect(gateway.languageModel).toHaveBeenCalledWith(
      "google/gemini-3.1-flash-lite-image"
    );
    expect(generateTextMock).toHaveBeenCalledWith({
      messages: [
        {
          content: [
            {
              text: expect.stringContaining("aspect ratio 16:9"),
              type: "text",
            },
            {
              image: "data:image/png;base64,cmVm",
              mediaType: "image/png",
              type: "image",
            },
          ],
          role: "user",
        },
      ],
      model: "language-model:google/gemini-3.1-flash-lite-image",
    });
  });

  it("throws an explicit no-image error when the provider returns no files", async () => {
    await expect(
      executeImageWorkflowRunPlan(
        {
          aspectRatio: "1:1",
          imageModel: "google/gemini-3.1-flash-lite-image",
          prompt: "Minimal still life",
          referenceImage: null,
          resultNodeId: "result-1",
          revision: 1,
        },
        { AI_GATEWAY_API_KEY: "test-key" },
        {
          createGateway: () =>
            ({
              languageModel: () => "language-model",
            }) as never,
          generateText: vi.fn().mockResolvedValue({ files: [] }),
        }
      )
    ).rejects.toThrowError("Image generation completed without an image file.");
  });

  it("redacts credentials from provider failures", async () => {
    await expect(
      executeImageWorkflowRunPlan(
        {
          aspectRatio: "1:1",
          imageModel: "google/gemini-3.1-flash-lite-image",
          prompt: "Minimal still life",
          referenceImage: null,
          resultNodeId: "result-1",
          revision: 1,
        },
        {
          AI_GATEWAY_API_KEY: "secret-key",
        },
        {
          createGateway: () =>
            ({
              languageModel: () => "language-model",
            }) as never,
          generateText: vi
            .fn()
            .mockRejectedValue(new Error("provider rejected secret-key")),
        }
      )
    ).rejects.toThrowError(
      "Image generation provider error: provider rejected [redacted]"
    );
  });
});
