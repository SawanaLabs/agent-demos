import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectGenerationWorkspace } from "./object-generation-workspace";
import type { ObjectGenerationSessionController } from "./use-object-generation-session";

const mockUseObjectGenerationSession = vi.hoisted(() =>
  vi.fn<() => ObjectGenerationSessionController>()
);

vi.mock("./use-object-generation-session", () => ({
  useObjectGenerationSession: mockUseObjectGenerationSession,
}));

describe("ObjectGenerationWorkspace", () => {
  beforeEach(() => {
    mockUseObjectGenerationSession.mockReturnValue({
      appendFiles: vi.fn(),
      composerError: null,
      entries: [
        {
          attachments: [],
          errorMessage: null,
          id: "entry-1",
          isActive: false,
          liveResult: {
            decision: "needs_review",
            riskScore: 68,
            summary: "Pricing claims need review.",
          },
          liveStatus: "ready",
          prompt: "Review this pricing page.",
          requestAttachments: [],
          result: {
            decision: "needs_review",
            riskScore: 68,
            summary: "Pricing claims need review.",
          },
          status: "ready",
        },
      ],
      hasMessages: true,
      inputResetKey: 0,
      isLoading: false,
      pendingAttachments: [],
      removePendingAttachment: vi.fn(),
      retryReview: vi.fn(),
      stopReview: vi.fn(),
      streamErrorMessage: null,
      submitReview: vi.fn(),
    });
  });

  it("labels the completed-run action as a new regeneration, not an audit replay", () => {
    const markup = renderToStaticMarkup(
      <ObjectGenerationWorkspace
        acceptedMediaTypes={["application/pdf", "image/*"]}
        chatModel="gpt-5-mini"
        isReviewAvailable
        nodeVersion="v24.0.0"
        setupMessage={null}
      />
    );

    expect(markup).toContain("Regenerate object");
    expect(markup).toContain(
      "Runs the same request again and generates a new result."
    );
    expect(markup).not.toContain("Replay generation");
  });
});
