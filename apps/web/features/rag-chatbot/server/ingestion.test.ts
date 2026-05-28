import { describe, expect, it } from "vitest";

import { buildRagPdfChunks } from "./ingestion";

describe("rag chatbot pdf ingestion", () => {
  it("builds citation-ready chunks from extracted pdf pages", () => {
    expect(
      buildRagPdfChunks([
        {
          pageNumber: 2,
          text: [
            "The Logotype",
            "",
            "The NASA logotype is the prime identifying element.",
            "It should appear consistently across routine communication.",
          ].join("\n"),
        },
      ])
    ).toEqual([
      {
        content:
          "The Logotype The NASA logotype is the prime identifying element. It should appear consistently across routine communication.",
        pageLabel: "2",
        sectionTitle: "The Logotype",
      },
    ]);
  });

  it("splits oversized page text into multiple chunks while preserving page metadata", () => {
    const chunks = buildRagPdfChunks(
      [
        {
          pageNumber: 6,
          text: [
            "Reproduction Standards",
            "",
            "Identity elements need controlled reproduction rules.",
            "Scaling errors damage recognition.",
            "Spacing mistakes damage recognition.",
            "Distortion damages recognition.",
          ].join("\n"),
        },
      ],
      { maxChunkLength: 90 }
    );

    expect(chunks).toHaveLength(3);
    expect(chunks.map((chunk) => chunk.pageLabel)).toEqual(["6", "6", "6"]);
    expect(chunks.map((chunk) => chunk.sectionTitle)).toEqual([
      "Reproduction Standards",
      "Reproduction Standards",
      "Reproduction Standards",
    ]);
    expect(chunks[0]?.content).toContain(
      "Identity elements need controlled reproduction rules."
    );
    expect(chunks[2]?.content).toContain("Distortion damages recognition.");
  });
});
