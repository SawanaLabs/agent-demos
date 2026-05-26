import { describe, expect, it } from "vitest";

import {
  demoCatalogEntries,
  readyDemoCatalogEntries,
  roadmapDemoCatalogEntries,
} from "./registry";

const readableWordPattern = /[A-Za-z]{2,}/;

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
      "persistent-agent",
      "streaming-chat-shell",
      "loop-agent",
      "skills-agent",
      "sandbox-agent",
      "mcp-agent",
      "openai-agents-sdk-demo",
      "trace-eval-agent",
      "ultra-chatbot-agent",
    ]);
  });

  it("derives ready and roadmap groups from the shared catalog entries", () => {
    expect(readyDemoCatalogEntries.map((entry) => entry.slug)).toEqual([
      "foundation-chat",
      "rag-chatbot",
      "multimodal-chatbot",
      "content-review",
      "customer-memory-agent",
      "persistent-agent",
      "streaming-chat-shell",
      "loop-agent",
      "skills-agent",
      "sandbox-agent",
      "mcp-agent",
      "openai-agents-sdk-demo",
      "trace-eval-agent",
      "ultra-chatbot-agent",
    ]);
    expect(roadmapDemoCatalogEntries.map((entry) => entry.slug)).toEqual([]);
  });

  it("requires every ready entry to provide an active route and gallery visual", () => {
    expect(
      readyDemoCatalogEntries.every(
        (entry) => entry.href.startsWith("/demos/") && !!entry.galleryVisual.ascii
      )
    ).toBe(true);
  });

  it("tracks demos migrated to ASCII gallery visuals", () => {
    const asciiEntries = demoCatalogEntries.filter(
      (entry) => entry.galleryVisual.ascii
    );

    expect(asciiEntries.map((entry) => entry.slug)).toEqual([
      "foundation-chat",
      "rag-chatbot",
      "multimodal-chatbot",
      "content-review",
      "customer-memory-agent",
      "persistent-agent",
      "streaming-chat-shell",
      "loop-agent",
      "skills-agent",
      "sandbox-agent",
      "mcp-agent",
      "openai-agents-sdk-demo",
      "trace-eval-agent",
      "ultra-chatbot-agent",
    ]);
    expect(
      asciiEntries.every((entry) =>
        entry.slug === "openai-agents-sdk-demo"
          ? true
          : !readableWordPattern.test(entry.galleryVisual.ascii ?? "")
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
        label: "Structured object",
        slug: "content-review",
      },
      {
        accent: "emerald",
        label: "Memory loop",
        slug: "customer-memory-agent",
      },
      {
        accent: "amber",
        label: "Persistent chat",
        slug: "persistent-agent",
      },
      {
        accent: "sky",
        label: "Streaming shell",
        slug: "streaming-chat-shell",
      },
      {
        accent: "amber",
        label: "Approval gate",
        slug: "loop-agent",
      },
      {
        accent: "emerald",
        label: "Skill folder",
        slug: "skills-agent",
      },
      {
        accent: "rose",
        label: "Live preview",
        slug: "sandbox-agent",
      },
      {
        accent: "cyan",
        label: "Connector hub",
        slug: "mcp-agent",
      },
      {
        accent: "indigo",
        label: "Official bridge",
        slug: "openai-agents-sdk-demo",
      },
      {
        accent: "cyan",
        label: "Trace + eval",
        slug: "trace-eval-agent",
      },
      {
        accent: "violet",
        label: "App-shape port",
        slug: "ultra-chatbot-agent",
      },
    ]);
  });
});
