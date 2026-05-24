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
      "multimodal-chatbot",
      "content-review",
      "customer-memory-agent",
      "streaming-chat-shell",
      "loop-agent",
      "skills-agent",
      "sandbox-agent",
      "mcp-agent",
    ]);
  });

  it("derives ready and roadmap groups from the shared catalog entries", () => {
    expect(readyDemoCatalogEntries.map((entry) => entry.slug)).toEqual([
      "foundation-chat",
      "rag-chatbot",
      "multimodal-chatbot",
      "content-review",
      "customer-memory-agent",
      "streaming-chat-shell",
      "loop-agent",
      "skills-agent",
      "sandbox-agent",
      "mcp-agent",
    ]);
    expect(roadmapDemoCatalogEntries.map((entry) => entry.slug)).toEqual([]);
  });
});
