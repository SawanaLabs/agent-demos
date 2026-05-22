import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";

import {
  getGroundedSourceKey,
  projectGroundedMessage,
} from "./grounded-response";

describe("grounded response projection", () => {
  it("projects assistant text, retrieval trace, and citation-ready sources from one message", () => {
    const message: UIMessage = {
      id: "message-1",
      parts: [
        { type: "text", text: "The manual says the logotype is the key design element." },
        {
          type: "tool-getInformation",
          toolCallId: "tool-1",
          state: "output-available",
          input: {
            question: "What does the manual say about the logotype?",
          },
          output: {
            answerable: true,
            message: "Found 1 relevant indexed document snippet.",
            sources: [
              {
                citationLabel: "NASA Graphics Standards Manual, p. 8",
                content:
                  "The logotype should always be shown in white against a background of NASA red.",
                documentUrl:
                  "https://www.nasa.gov/wp-content/uploads/2015/01/nasa_graphics_manual_nhb_1430-2_jan_1976.pdf",
                pageLabel: "8",
                sectionTitle: "The NASA Logotype: Use of Color",
                similarity: 0.7,
                title: "NASA Graphics Standards Manual",
              },
            ],
          },
        },
      ],
      role: "assistant",
    };

    const projection = projectGroundedMessage(message);

    expect(projection.text).toContain("logotype is the key design element");
    expect(projection.toolParts).toHaveLength(1);
    expect(projection.sources).toEqual([
      {
        citationLabel: "NASA Graphics Standards Manual, p. 8",
        content:
          "The logotype should always be shown in white against a background of NASA red.",
        documentUrl:
          "https://www.nasa.gov/wp-content/uploads/2015/01/nasa_graphics_manual_nhb_1430-2_jan_1976.pdf",
        pageLabel: "8",
        sectionTitle: "The NASA Logotype: Use of Color",
        similarity: 0.7,
        title: "NASA Graphics Standards Manual",
      },
    ]);
  });

  it("creates unique source keys even when one message repeats the citation label", () => {
    const source = {
      citationLabel: "NASA Graphics Standards Manual, p. 8",
      content:
        "The logotype should always be shown in white against a background of NASA red.",
      documentUrl:
        "https://www.nasa.gov/wp-content/uploads/2015/01/nasa_graphics_manual_nhb_1430-2_jan_1976.pdf",
      pageLabel: "8",
      sectionTitle: "The NASA Logotype: Use of Color",
      similarity: 0.7,
      title: "NASA Graphics Standards Manual",
    };

    expect(getGroundedSourceKey("message-1", source, 0)).not.toBe(
      getGroundedSourceKey(
        "message-1",
        {
          ...source,
          content:
            "The examples shown below illustrate acceptable uses of the NASA logotype in various situations.",
        },
        1
      )
    );
  });
});
