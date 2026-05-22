import { describe, expect, it } from "vitest";

import type { RagToolSource } from "@/features/rag-chatbot/server/retrieval";

import { getSourceItemKey } from "./source-item-key";

const baseSource: RagToolSource = {
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

describe("getSourceItemKey", () => {
  it("stays unique when one message contains multiple sources with the same citation label", () => {
    const firstKey = getSourceItemKey("message-1", baseSource, 0);
    const secondKey = getSourceItemKey(
      "message-1",
      {
        ...baseSource,
        content:
          "The examples shown below illustrate acceptable uses of the NASA logotype in various situations.",
      },
      1
    );

    expect(firstKey).not.toBe(secondKey);
  });
});
