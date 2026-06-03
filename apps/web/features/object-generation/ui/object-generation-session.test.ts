import { describe, expect, it } from "vitest";

import type { PendingReviewAttachment } from "./convert-files-to-object-generation-inputs";
import {
  collectReviewPreviewUrls,
  createReviewThreadEntry,
  failReviewThreadEntry,
  mergePendingReviewAttachments,
  restartReviewThreadEntry,
  stopReviewThreadEntry,
  toDisplayReviewThreadEntries,
} from "./object-generation-session";

function makePendingAttachment(
  id: string,
  filename: string,
  previewUrl: string
): PendingReviewAttachment {
  return {
    file: new File(["demo"], filename, { type: "image/png" }),
    id,
    previewUrl,
  };
}

describe("object-generation session", () => {
  it("creates one streaming entry from prompt and pending attachments", () => {
    const pendingAttachments = [
      makePendingAttachment("hero", "hero.png", "blob:hero"),
      makePendingAttachment("policy", "policy.pdf", "blob:policy"),
    ];

    expect(
      createReviewThreadEntry({
        id: "entry-1",
        pendingAttachments,
        prompt: "Review this submission.",
        requestAttachments: [
          {
            filename: "hero.png",
            mediaType: "image/png",
            url: "data:image/png;base64,AAA",
          },
        ],
      })
    ).toMatchObject({
      attachments: [
        {
          filename: "hero.png",
          id: "hero",
          mediaType: "image/png",
          previewUrl: "blob:hero",
        },
        {
          filename: "policy.pdf",
          id: "policy",
          mediaType: "image/png",
          previewUrl: "blob:policy",
        },
      ],
      errorMessage: null,
      id: "entry-1",
      prompt: "Review this submission.",
      status: "streaming",
    });
  });

  it("merges pending attachments by id and collects preview urls across the thread", () => {
    const current = [makePendingAttachment("hero", "hero.png", "blob:hero")];
    const next = [
      makePendingAttachment("hero", "hero.png", "blob:hero"),
      makePendingAttachment("policy", "policy.pdf", "blob:policy"),
    ];
    const merged = mergePendingReviewAttachments(current, next);
    const entry = createReviewThreadEntry({
      id: "entry-1",
      pendingAttachments: merged,
      prompt: "",
      requestAttachments: [],
    });

    expect(merged.map((attachment) => attachment.id)).toEqual([
      "hero",
      "policy",
    ]);
    expect(Array.from(collectReviewPreviewUrls(merged, [entry]))).toEqual([
      "blob:hero",
      "blob:policy",
    ]);
  });

  it("moves an entry through error, stop, and replay display states", () => {
    const entry = createReviewThreadEntry({
      id: "entry-1",
      pendingAttachments: [
        makePendingAttachment("hero", "hero.png", "blob:hero"),
      ],
      prompt: "Review this.",
      requestAttachments: [],
    });

    const failed = failReviewThreadEntry(
      [entry],
      "entry-1",
      "stream failed",
      {
        summary: "Partial result",
      }
    );
    const stopped = stopReviewThreadEntry(failed, "entry-1", {
      summary: "Stopped result",
    });
    const restarted = restartReviewThreadEntry(stopped, "entry-1");
    const displayEntries = toDisplayReviewThreadEntries(
      restarted,
      "entry-1",
      true,
      {
        summary: "Live result",
      }
    );

    expect(failed[0]?.status).toBe("error");
    expect(stopped[0]?.status).toBe("stopped");
    expect(displayEntries[0]).toMatchObject({
      isActive: true,
      liveResult: {
        summary: "Live result",
      },
      liveStatus: "streaming",
      status: "streaming",
    });
  });
});
