import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ConversationErrorMessage } from "./conversation-error-message";

describe("conversation error message", () => {
  it("renders a retryable assistant-side error inside the conversation", () => {
    const markup = renderToStaticMarkup(
      createElement(ConversationErrorMessage, {
        error: new Error("Model stream failed."),
        onRetry: vi.fn(),
      })
    );

    expect(markup).toContain("Assistant response failed");
    expect(markup).toContain("Model stream failed.");
    expect(markup).toContain("Retry");
  });
});
