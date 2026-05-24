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

  it("requires every ready entry to provide an active route and gallery visual", () => {
    expect(
      readyDemoCatalogEntries.every(
        (entry) =>
          entry.href.startsWith("/demos/") &&
          entry.galleryVisual.steps.length === 3
      )
    ).toBe(true);
  });

  it("keeps every entry aligned to the gallery visual contract", () => {
    expect(
      demoCatalogEntries.map((entry) => ({
        accent: entry.galleryVisual.accent,
        label: entry.galleryVisual.label,
        slug: entry.slug,
      }))
    ).toEqual([
      {
        accent: "sky",
        label: "Base chat",
        slug: "foundation-chat",
      },
      {
        accent: "amber",
        label: "Knowledge base",
        slug: "rag-chatbot",
      },
      {
        accent: "violet",
        label: "Mixed input",
        slug: "multimodal-chatbot",
      },
      {
        accent: "indigo",
        label: "Object review",
        slug: "content-review",
      },
      {
        accent: "emerald",
        label: "Memory loop",
        slug: "customer-memory-agent",
      },
      {
        accent: "sky",
        label: "Streaming shell",
        slug: "streaming-chat-shell",
      },
      {
        accent: "amber",
        label: "Loop control",
        slug: "loop-agent",
      },
      {
        accent: "emerald",
        label: "Skill drafting",
        slug: "skills-agent",
      },
      {
        accent: "rose",
        label: "Live preview",
        slug: "sandbox-agent",
      },
      {
        accent: "cyan",
        label: "Runtime doctor",
        slug: "mcp-agent",
      },
    ]);
  });
});
