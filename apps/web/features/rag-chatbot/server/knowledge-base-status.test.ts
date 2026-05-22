import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  ensureRagKnowledgeBaseReady,
  getIndexedResourceCount,
  getRagIndexRequiredMessage,
  getRagKnowledgeBaseStatus,
} from "./knowledge-base-status";
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

function createResourcesDatabaseDouble(resourceCount: number) {
  const resourcesTable = pgTable("test_rag_resources", {
    documentUrl: text("document_url"),
    id: uuid("id"),
    sourceSlug: varchar("source_slug", { length: 191 }),
    title: text("title"),
  });
  const state = {
    whereValues: [] as string[][],
  };

  return {
    loadDatabase: async () => ({
      database: {
        select() {
          return {
            from(table: unknown) {
              if (table !== resourcesTable) {
                throw new Error("Unsupported table in status test double.");
              }

              return {
                where(condition: unknown) {
                  state.whereValues.push(collectPrimitiveValues(condition));

                  return Promise.resolve([{ resourceCount }]);
                },
              };
            },
          };
        },
      },
      ragChatbotResources: resourcesTable,
    }),
    state,
  };
}

describe("rag chatbot knowledge base status", () => {
  it("returns setup required when DATABASE_URL is missing", async () => {
    await expect(getRagKnowledgeBaseStatus({})).resolves.toEqual({
      indexedResourceCount: 0,
      isReady: false,
      message:
        "DATABASE_URL is missing. The RAG chatbot can render, but chat requests require a preindexed pgvector database.",
      statusLabel: "Setup required",
    });
  });

  it("returns index required when the configured source PDF has not been indexed", async () => {
    const databaseDouble = createResourcesDatabaseDouble(0);

    await expect(
      getRagKnowledgeBaseStatus(
        {
          DATABASE_URL: "postgresql://user:password@localhost:5432/database",
        },
        {
          loadDatabase: databaseDouble.loadDatabase as never,
        }
      )
    ).resolves.toEqual({
      indexedResourceCount: 0,
      isReady: false,
      message: getRagIndexRequiredMessage(),
      statusLabel: "Index required",
    });
  });

  it("scopes indexed resource counting to the configured source slug", async () => {
    const databaseDouble = createResourcesDatabaseDouble(2);

    await expect(
      getIndexedResourceCount(
        {
          DATABASE_URL: "postgresql://user:password@localhost:5432/database",
        },
        {
          loadDatabase: databaseDouble.loadDatabase as never,
        }
      )
    ).resolves.toBe(2);

    expect(databaseDouble.state.whereValues).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          "source_slug",
          ragChatbotSourceDocument.slug,
        ]),
      ])
    );
  });

  it("throws the index-required message when chat tries to run without indexed content", async () => {
    const databaseDouble = createResourcesDatabaseDouble(0);

    await expect(
      ensureRagKnowledgeBaseReady(
        {
          DATABASE_URL: "postgresql://user:password@localhost:5432/database",
        },
        {
          loadDatabase: databaseDouble.loadDatabase as never,
        }
      )
    ).rejects.toThrow(getRagIndexRequiredMessage());
  });
});
