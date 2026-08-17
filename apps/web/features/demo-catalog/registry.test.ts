import { describe, expect, it } from "vitest";

import {
  demoCatalogEntries,
  getLatestReadyDemoCatalogEntries,
  latestReadyDemoCatalogEntries,
  readyDemoCatalogEntries,
  roadmapDemoCatalogEntries,
} from "./registry";

const readableWordPattern = /[A-Za-z]{2,}/;

describe("latest ready demo catalog group", () => {
  it("selects the four newest releases in descending order", () => {
    const baseEntry = readyDemoCatalogEntries[0];

    if (!baseEntry) {
      throw new Error("Expected at least one ready demo catalog entry");
    }
    const releases = (
      [
        ["oldest", "2026-01-01T00:00:00Z"],
        ["second", "2026-01-02T00:00:00Z"],
        ["third", "2026-01-03T00:00:00Z"],
        ["fourth", "2026-01-04T00:00:00Z"],
        ["newest", "2026-01-05T00:00:00Z"],
      ] as const
    ).map(([slug, publishedAt]) => ({
      ...baseEntry,
      publishedAt,
      slug,
    }));

    expect(
      getLatestReadyDemoCatalogEntries(releases).map((entry) => entry.slug)
    ).toEqual(["newest", "fourth", "third", "second"]);
  });

  it("matches the current catalog's four newest releases", () => {
    expect(latestReadyDemoCatalogEntries).toEqual(
      getLatestReadyDemoCatalogEntries(readyDemoCatalogEntries)
    );
  });

  it("rejects malformed publication timestamps", () => {
    const baseEntry = readyDemoCatalogEntries[0];

    if (!baseEntry) {
      throw new Error("Expected at least one ready demo catalog entry");
    }
    const releases = [
      {
        ...baseEntry,
        publishedAt: "2026-01-01T00:00:00Z",
        slug: "valid-release",
      },
      {
        ...baseEntry,
        publishedAt: "2026-02-30T00:00:00Z",
        slug: "invalid-release",
      },
    ];

    expect(() => getLatestReadyDemoCatalogEntries(releases)).toThrow(
      "Invalid publishedAt for demo: invalid-release"
    );
  });
});

describe("demo catalog registry", () => {
  it("aggregates one demo catalog entry per demo slug", () => {
    const slugs = demoCatalogEntries.map((entry) => entry.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toEqual([
      "foundation-chat",
      "rag-chatbot",
      "multimodal-chatbot",
      "object-generation",
      "generative-ui",
      "minimal-chat-agent",
      "image-workflow-agent",
      "customer-memory-agent",
      "persistent-agent",
      "streaming-chat-shell",
      "loop-agent",
      "langgraph-agent",
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
      "object-generation",
      "generative-ui",
      "minimal-chat-agent",
      "image-workflow-agent",
      "customer-memory-agent",
      "persistent-agent",
      "streaming-chat-shell",
      "loop-agent",
      "langgraph-agent",
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
        (entry) =>
          entry.href.startsWith("/demos/") && !!entry.galleryVisual.ascii
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
      "object-generation",
      "generative-ui",
      "minimal-chat-agent",
      "image-workflow-agent",
      "customer-memory-agent",
      "persistent-agent",
      "streaming-chat-shell",
      "loop-agent",
      "langgraph-agent",
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
        slug: "object-generation",
      },
      {
        accent: "rose",
        label: "UI tools",
        slug: "generative-ui",
      },
      {
        accent: "cyan",
        label: "Search + HITL",
        slug: "minimal-chat-agent",
      },
      {
        accent: "indigo",
        label: "Workflow canvas",
        slug: "image-workflow-agent",
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
        label: "LangGraph bridge",
        slug: "langgraph-agent",
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
