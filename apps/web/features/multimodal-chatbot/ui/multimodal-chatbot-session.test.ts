import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import {
  buildPendingAttachmentId,
  getMultimodalFileParts,
  getMultimodalMessageText,
  mergePendingAttachments,
  type PendingAttachment,
} from "./multimodal-chatbot-session";

function createPendingAttachment(input: {
  id: string;
  name?: string;
  previewUrl?: string;
}): PendingAttachment {
  return {
    file: {
      lastModified: 1,
      name: input.name ?? `${input.id}.png`,
      size: 100,
      type: "image/png",
    } as File,
    id: input.id,
    previewUrl: input.previewUrl ?? `blob:${input.id}`,
  };
}

describe("multimodal chatbot session helpers", () => {
  it("derives stable attachment ids from file metadata", () => {
    expect(
      buildPendingAttachmentId({
        lastModified: 456,
        name: "diagram.png",
        size: 123,
      } as File)
    ).toBe("diagram.png-123-456");
  });

  it("keeps the latest pending attachment when duplicate ids are added", () => {
    expect(
      mergePendingAttachments(
        [createPendingAttachment({ id: "a", previewUrl: "blob:old-a" })],
        [
          createPendingAttachment({ id: "a", previewUrl: "blob:new-a" }),
          createPendingAttachment({ id: "b" }),
        ]
      )
    ).toEqual([
      createPendingAttachment({ id: "a", previewUrl: "blob:new-a" }),
      createPendingAttachment({ id: "b" }),
    ]);
  });

  it("separates visible text from file parts", () => {
    const message: UIMessage = {
      id: "message-1",
      parts: [
        { text: "first", type: "text" },
        {
          filename: "chart.png",
          mediaType: "image/png",
          type: "file",
          url: "data:image/png;base64,abc",
        },
        { text: "second", type: "text" },
      ],
      role: "user",
    };

    expect(getMultimodalMessageText(message)).toBe("first\nsecond");
    expect(getMultimodalFileParts(message)).toEqual([
      {
        filename: "chart.png",
        mediaType: "image/png",
        type: "file",
        url: "data:image/png;base64,abc",
      },
    ]);
  });
});
