import { pgTable, text, uuid, varchar, vector } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import { createRagToolResult, findRelevantContent } from "./retrieval";
import { ragChatbotSourceDocument } from "./source-document";

function collectPrimitiveValues(
  value: unknown,
  seen = new Set<unknown>()
): string[] {
  if (value == null || seen.has(value)) {
    return [];
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return [String(value)];
  }

  if (typeof value !== "object") {
    return [];
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.flatMap((entry) => collectPrimitiveValues(entry, seen));
  }

  return Object.values(value).flatMap((entry) =>
    collectPrimitiveValues(entry, seen)
  );
}

function createScopedQueryDatabaseDouble() {
  const resourcesTable = pgTable("test_rag_resources", {
    documentUrl: text("document_url"),
    id: uuid("id"),
    sourceSlug: varchar("source_slug", { length: 191 }),
    title: text("title"),
  });
  const embeddingsTable = pgTable("test_rag_embeddings", {
    content: text("content"),
    embedding: vector("embedding", { dimensions: 1536 }),
    pageLabel: varchar("page_label", { length: 64 }),
    resourceId: uuid("resource_id"),
    sectionTitle: text("section_title"),
  });
  const state = {
    matchWhereValues: [] as string[][],
    resourceWhereValues: [] as string[][],
  };

  return {
    loadDatabase: async () => ({
      database: {
        select() {
          return {
            from(table: unknown) {
              if (table === resourcesTable) {
                return {
                  where(condition: unknown) {
                    state.resourceWhereValues.push(
                      collectPrimitiveValues(condition)
                    );

                    return Promise.resolve([{ resourceCount: 1 }]);
                  },
                };
              }

              if (table === embeddingsTable) {
                return {
                  innerJoin() {
                    return {
                      where(condition: unknown) {
                        state.matchWhereValues.push(
                          collectPrimitiveValues(condition)
                        );

                        return {
                          orderBy() {
                            return {
                              limit() {
                                return Promise.resolve([
                                  {
                                    content:
                                      "The NASA logotype is the central design element.",
                                    documentUrl:
                                      ragChatbotSourceDocument.documentUrl,
                                    pageLabel: "5",
                                    sectionTitle: "The NASA Logotype",
                                    similarity: 0.72,
                                    title: ragChatbotSourceDocument.title,
                                  },
                                ]);
                              },
                            };
                          },
                        };
                      },
                    };
                  },
                };
              }

              throw new Error("Unsupported table in retrieval test double.");
            },
          };
        },
      },
      ragChatbotEmbeddings: embeddingsTable,
      ragChatbotResources: resourcesTable,
    }),
    state,
  };
}

describe("rag chatbot retrieval result", () => {
  it("marks retrieval as unanswerable when no source snippets are available", () => {
    expect(createRagToolResult([])).toEqual({
      answerable: false,
      message:
        "No relevant indexed document snippets were found for this question.",
      sources: [],
    });
  });

  it("returns citation-ready snippets from retrieved source content", () => {
    expect(
      createRagToolResult([
        {
          content: "The logotype is the prime design element.",
          documentUrl: "https://example.com/manual.pdf",
          pageLabel: "2",
          sectionTitle: "The Logotype",
          similarity: 0.82,
          title: "NASA Graphics Standards Manual",
        },
      ])
    ).toEqual({
      answerable: true,
      message: "Found 1 relevant indexed document snippet.",
      sources: [
        {
          citationLabel: "NASA Graphics Standards Manual, p. 2",
          content: "The logotype is the prime design element.",
          documentUrl: "https://example.com/manual.pdf",
          pageLabel: "2",
          sectionTitle: "The Logotype",
          similarity: 0.82,
          title: "NASA Graphics Standards Manual",
        },
      ],
    });
  });

  it("returns early for blank queries without touching embedding or retrieval dependencies", async () => {
    const generateEmbedding = vi.fn();
    const ensureKnowledgeBaseReady = vi.fn();
    const findMatches = vi.fn();

    await expect(
      findRelevantContent("   ", {}, {
        ensureKnowledgeBaseReady,
        findMatches,
        generateEmbedding,
      })
    ).resolves.toEqual({
      answerable: false,
      message:
        "No relevant indexed document snippets were found for this question.",
      sources: [],
    });

    expect(ensureKnowledgeBaseReady).not.toHaveBeenCalled();
    expect(findMatches).not.toHaveBeenCalled();
    expect(generateEmbedding).not.toHaveBeenCalled();
  });

  it("requires the configured source PDF to be indexed before retrieval", async () => {
    const ensureKnowledgeBaseReady = vi.fn(async () => {
      throw new Error("No preindexed documents are available.");
    });

    await expect(
      findRelevantContent("logotype", {}, {
        ensureKnowledgeBaseReady,
        findMatches: vi.fn(),
        generateEmbedding: vi.fn(),
      })
    ).rejects.toThrow(/preindexed documents/i);
  });

  it("scopes the actual resource-count and retrieval queries to the configured source document slug", async () => {
    const databaseDouble = createScopedQueryDatabaseDouble();
    const generateEmbedding = vi.fn(async () => [0.1, 0.2, 0.3]);
    const ensureKnowledgeBaseReady = vi.fn(async () => undefined);

    await expect(
      findRelevantContent("NASA logotype", {}, {
        ensureKnowledgeBaseReady,
        generateEmbedding,
        loadDatabase: databaseDouble.loadDatabase as never,
      })
    ).resolves.toEqual({
      answerable: true,
      message: "Found 1 relevant indexed document snippet.",
      sources: [
        {
          citationLabel: "NASA Graphics Standards Manual, p. 5",
          content: "The NASA logotype is the central design element.",
          documentUrl: ragChatbotSourceDocument.documentUrl,
          pageLabel: "5",
          sectionTitle: "The NASA Logotype",
          similarity: 0.72,
          title: ragChatbotSourceDocument.title,
        },
      ],
    });

    expect(generateEmbedding).toHaveBeenCalledWith("NASA logotype", {});
    expect(ensureKnowledgeBaseReady).toHaveBeenCalledWith({});
    expect(databaseDouble.state.matchWhereValues).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          "source_slug",
          ragChatbotSourceDocument.slug,
        ]),
      ])
    );
  });
});
