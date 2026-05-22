import { describe, expect, it } from "vitest";

import {
  demoCatalogEntries,
  readyDemoCatalogEntries,
  roadmapDemoCatalogEntries,
} from "./registry";

describe("demo catalog registry", () => {
  it("aggregates one demo catalog entry per demo slug", () => {
    const slugs = demoCatalogEntries.map((entry) => entry.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual([
      "foundation-chat",
      "rag-chatbot",
      "loop-agent",
      "skills-agent",
      "sandbox-agent",
    ]);
  });

  it("derives ready and roadmap groups from the shared catalog entries", () => {
    expect(readyDemoCatalogEntries.map((entry) => entry.slug)).toEqual([
      "foundation-chat",
      "rag-chatbot",
    ]);
    expect(roadmapDemoCatalogEntries.map((entry) => entry.slug)).toEqual([
      "loop-agent",
      "skills-agent",
      "sandbox-agent",
    ]);
  });
});
