import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAiGatewayMock, embedManyMock } = vi.hoisted(() => ({
  createAiGatewayMock: vi.fn(),
  embedManyMock: vi.fn(),
}));

vi.mock("ai", () => ({
  embedMany: embedManyMock,
}));

vi.mock("@/features/shared/ai-gateway/server/env", () => ({
  createAiGateway: createAiGatewayMock,
}));

import { indexRagChatbotSource } from "./index-source";

interface ResourceRow {
  contentHash: string;
  description?: string | null;
  documentUrl?: string;
  id: string;
  sourcePageUrl?: string;
  sourceSlug?: string;
  title?: string;
  updatedAt?: Date;
}

interface EmbeddingRow {
  chunkIndex: number;
  content: string;
  embedding: number[];
  pageLabel: string;
  resourceId: string;
  sectionTitle: string | null;
}

function cloneState<T>(value: T): T {
  return structuredClone(value);
}

function createDatabaseDouble(options: {
  embeddingInsertError?: Error;
  existingChunkCount?: number;
  existingResource?: ResourceRow;
}) {
  const resourcesTable = {
    contentHash: "contentHash",
    description: "description",
    documentUrl: "documentUrl",
    id: "id",
    sourcePageUrl: "sourcePageUrl",
    sourceSlug: "sourceSlug",
    title: "title",
    updatedAt: "updatedAt",
  };
  const embeddingsTable = {
    chunkIndex: "chunkIndex",
    content: "content",
    embedding: "embedding",
    pageLabel: "pageLabel",
    resourceId: "resourceId",
    sectionTitle: "sectionTitle",
  };
  const existingResource = options.existingResource;
  const state = {
    deletedEmbeddingResourceIds: [] as string[],
    deletedResourceIds: [] as string[],
    embeddingRows: existingResource
      ? Array.from({ length: options.existingChunkCount ?? 0 }, (_, index) => ({
          chunkIndex: index,
          content: `existing-${index}`,
          embedding: [index],
          pageLabel: "1",
          resourceId: existingResource.id,
          sectionTitle: null,
        }))
      : ([] as EmbeddingRow[]),
    insertedResourceRows: [] as Array<Record<string, unknown>>,
    resource: existingResource ? cloneState(existingResource) : null,
    resourceUpdates: [] as Array<Record<string, unknown>>,
  };

  function createClient(currentState: typeof state): any {
    return {
      delete(table: unknown) {
        return {
          where() {
            if (table === embeddingsTable && currentState.resource) {
              const resourceId = currentState.resource.id;

              currentState.deletedEmbeddingResourceIds.push(
                resourceId
              );
              currentState.embeddingRows = currentState.embeddingRows.filter(
                (row) => row.resourceId !== resourceId
              );
              return Promise.resolve();
            }

            if (table === resourcesTable && currentState.resource) {
              currentState.deletedResourceIds.push(currentState.resource.id);
              currentState.embeddingRows = currentState.embeddingRows.filter(
                (row) => row.resourceId !== currentState.resource?.id
              );
              currentState.resource = null;
            }

            return Promise.resolve();
          },
        };
      },
      insert(table: unknown) {
        return {
          values(values: Record<string, unknown> | Array<Record<string, unknown>>) {
            if (table === resourcesTable && !Array.isArray(values)) {
              currentState.insertedResourceRows.push(values);
              currentState.resource = {
                ...((values as unknown) as ResourceRow),
                id: currentState.resource?.id ?? "resource-2",
              };

              return {
                returning() {
                  return Promise.resolve([
                    { id: currentState.resource?.id ?? "resource-2" },
                  ]);
                },
              };
            }

            if (table === embeddingsTable && Array.isArray(values)) {
              if (options.embeddingInsertError) {
                return Promise.reject(options.embeddingInsertError);
              }

              currentState.embeddingRows = (values as unknown) as EmbeddingRow[];
              return Promise.resolve();
            }

            throw new Error("Unsupported insert shape in test double.");
          },
        };
      },
      select(_fields: Record<string, unknown>) {
        return {
          from(table: unknown) {
            if (table === embeddingsTable) {
              return {
                where() {
                  return Promise.resolve([
                    { chunkCount: currentState.embeddingRows.length },
                  ]);
                },
              };
            }

            return {
              where() {
                return {
                  limit() {
                    return Promise.resolve(
                      currentState.resource ? [currentState.resource] : []
                    );
                  },
                  innerJoin() {
                    return {
                      where() {
                        return {
                          orderBy() {
                            return {
                              limit() {
                                return Promise.resolve([]);
                              },
                            };
                          },
                        };
                      },
                    };
                  },
                };
              },
              limit() {
                return Promise.resolve(
                  currentState.resource ? [currentState.resource] : []
                );
              },
            };
          },
        };
      },
      transaction<T>(callback: (tx: ReturnType<typeof createClient>) => Promise<T>) {
        const draftState = cloneState(currentState);
        const txClient = createClient(draftState);

        return callback(txClient).then(
          (result) => {
            Object.assign(currentState, draftState);
            return result;
          },
          (error) => {
            throw error;
          }
        );
      },
      update(table: unknown) {
        if (table !== resourcesTable) {
          throw new Error("Unsupported table passed to update in test double.");
        }

        return {
          set(values: Record<string, unknown>) {
            return {
              where() {
                if (!currentState.resource) {
                  throw new Error("Cannot update a missing resource.");
                }

                currentState.resourceUpdates.push(values);
                currentState.resource = {
                  ...currentState.resource,
                  ...values,
                };

                return Promise.resolve();
              },
            };
          },
        };
      },
    };
  }

  return {
    database: createClient(state),
    ragChatbotEmbeddings: embeddingsTable,
    ragChatbotResources: resourcesTable,
    state,
  };
}

describe("indexRagChatbotSource", () => {
  beforeEach(() => {
    embedManyMock.mockReset();
    createAiGatewayMock.mockReset();
    createAiGatewayMock.mockReturnValue({
      embeddingModel: vi.fn().mockReturnValue("embedding-model"),
    });
  });

  it("returns already-indexed when the PDF hash matches the stored resource", async () => {
    const pdfBytes = new Uint8Array([1, 2, 3]);
    const existingHash =
      "039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81";
    const databaseDouble = createDatabaseDouble({
      existingChunkCount: 7,
      existingResource: {
        contentHash: existingHash,
        id: "resource-1",
      },
    });

    const result = await indexRagChatbotSource(
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://example",
      },
      {
        downloadDocument: async () => pdfBytes,
        extractPages: async () => {
          throw new Error("extractPages should not run for unchanged PDFs");
        },
        loadDatabase: async () => databaseDouble as never,
      }
    );

    expect(result).toEqual({
      chunkCount: 7,
      sourceSlug: "nasa-graphics-standards-manual",
      status: "already-indexed",
    });
    expect(embedManyMock).not.toHaveBeenCalled();
    expect(databaseDouble.state.deletedResourceIds).toEqual([]);
  });

  it("replaces an outdated indexed PDF without deleting the resource row", async () => {
    const pdfBytes = new Uint8Array([8, 13, 21]);
    const databaseDouble = createDatabaseDouble({
      existingChunkCount: 1,
      existingResource: {
        contentHash: "outdated-hash",
        id: "resource-1",
        title: "Old title",
      },
    });

    embedManyMock.mockResolvedValue({
      embeddings: [
        [0.1, 0.2],
        [0.3, 0.4],
      ],
    });

    const result = await indexRagChatbotSource(
      {
        AI_GATEWAY_API_KEY: "test-key",
        DATABASE_URL: "postgresql://example",
      },
      {
        downloadDocument: async () => pdfBytes,
        extractPages: async () => [
          {
            pageNumber: 1,
            text: "Logotype usage.\nUse the logotype consistently across approved layouts.",
          },
          {
            pageNumber: 2,
            text: "Seal usage.\nReserve the seal for official and ceremonial applications.",
          },
        ],
        loadDatabase: async () => databaseDouble as never,
      }
    );

    expect(result).toEqual({
      chunkCount: 2,
      sourceSlug: "nasa-graphics-standards-manual",
      status: "indexed",
    });
    expect(embedManyMock).toHaveBeenCalledWith({
      model: "embedding-model",
      values: [
        "Logotype usage. Use the logotype consistently across approved layouts.",
        "Seal usage. Reserve the seal for official and ceremonial applications.",
      ],
    });
    expect(databaseDouble.state.deletedResourceIds).toEqual([]);
    expect(databaseDouble.state.resourceUpdates).toHaveLength(1);
    expect(databaseDouble.state.deletedEmbeddingResourceIds).toEqual([
      "resource-1",
    ]);
    expect(databaseDouble.state.embeddingRows).toMatchObject([
      {
        chunkIndex: 0,
        content:
          "Logotype usage. Use the logotype consistently across approved layouts.",
        pageLabel: "1",
        resourceId: "resource-1",
        sectionTitle: "Logotype usage.",
      },
      {
        chunkIndex: 1,
        content:
          "Seal usage. Reserve the seal for official and ceremonial applications.",
        pageLabel: "2",
        resourceId: "resource-1",
        sectionTitle: "Seal usage.",
      },
    ]);
  });

  it("preserves the previous indexed corpus when embedding insert fails", async () => {
    const pdfBytes = new Uint8Array([34, 55, 89]);
    const databaseDouble = createDatabaseDouble({
      embeddingInsertError: new Error("embedding insert failed"),
      existingChunkCount: 2,
      existingResource: {
        contentHash: "outdated-hash",
        id: "resource-1",
        title: "Old title",
      },
    });

    embedManyMock.mockResolvedValue({
      embeddings: [
        [0.1, 0.2],
        [0.3, 0.4],
      ],
    });

    await expect(
      indexRagChatbotSource(
        {
          AI_GATEWAY_API_KEY: "test-key",
          DATABASE_URL: "postgresql://example",
        },
        {
          downloadDocument: async () => pdfBytes,
          extractPages: async () => [
            {
              pageNumber: 1,
              text: "Logotype usage.\nUse the logotype consistently across approved layouts.",
            },
            {
              pageNumber: 2,
              text: "Seal usage.\nReserve the seal for official and ceremonial applications.",
            },
          ],
          loadDatabase: async () => databaseDouble as never,
        }
      )
    ).rejects.toThrow("embedding insert failed");

    expect(databaseDouble.state.deletedResourceIds).toEqual([]);
    expect(databaseDouble.state.resource?.contentHash).toBe("outdated-hash");
    expect(databaseDouble.state.embeddingRows).toHaveLength(2);
    expect(databaseDouble.state.embeddingRows).toMatchObject([
      { content: "existing-0", resourceId: "resource-1" },
      { content: "existing-1", resourceId: "resource-1" },
    ]);
  });
});
