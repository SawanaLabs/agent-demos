import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FeatureComparisonMatrix } from "./feature-comparison-matrix";
import type { GenerativeUiToolPart } from "./message-parts";

describe("FeatureComparisonMatrix", () => {
  it("renders partial comparison input while the UI tool is streaming", () => {
    const html = renderToStaticMarkup(
      <FeatureComparisonMatrix
        part={
          {
            input: {
              criteria: [
                {
                  label: "Setup speed",
                  scores: [
                    {
                      option: "Streaming Generative UI",
                      rating: "best",
                      summary: "Uses the native tool input stream.",
                    },
                  ],
                },
              ],
              options: [
                {
                  name: "Streaming Generative UI",
                },
              ],
              subject: "Generative UI demo slices",
            },
            state: "input-streaming",
            toolCallId: "call_compare",
            type: "tool-showFeatureComparison",
          } as GenerativeUiToolPart
        }
      />
    );

    expect(html).toContain("Generative UI demo slices");
    expect(html).toContain("Streaming Generative UI");
    expect(html).toContain("Setup speed");
    expect(html).toContain("Uses the native tool input stream.");
    expect(html).not.toContain("Comparison output did not match");
  });

  it("renders a user-facing error when comparison finalization fails", () => {
    const html = renderToStaticMarkup(
      <FeatureComparisonMatrix
        part={
          {
            input: {
              subject: "Support chatbot architecture",
            },
            state: "output-error",
            toolCallId: "call_compare",
            type: "tool-showFeatureComparison",
          } as GenerativeUiToolPart
        }
      />
    );

    expect(html).toContain("Comparison output could not be finalized.");
    expect(html).not.toContain("output-error");
    expect(html).not.toContain("Comparison generated");
  });

  it("allows comparison cells to wrap inside the mobile table scroller", () => {
    const html = renderToStaticMarkup(
      <FeatureComparisonMatrix
        part={
          {
            output: {
              criteria: [
                {
                  label: "Knowledge grounding",
                  scores: [
                    {
                      option: "RAG",
                      rating: "best",
                      summary:
                        "Directly retrieves documents to reduce unsupported claims.",
                    },
                  ],
                },
              ],
              kind: "feature-comparison",
              options: [
                {
                  name: "RAG",
                  summary: "Retrieval augmented generation.",
                },
              ],
              subject: "Support chatbot architecture",
              summary: "Use the matrix for tradeoffs.",
            },
            state: "output-available",
            toolCallId: "call_compare",
            type: "tool-showFeatureComparison",
          } as GenerativeUiToolPart
        }
      />
    );

    expect(html).toContain("whitespace-normal");
    expect(html).toContain("break-words");
  });
});
