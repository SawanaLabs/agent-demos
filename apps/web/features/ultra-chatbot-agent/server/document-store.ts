import { and, desc, eq, gt } from "@workspace/database/drizzle";

export interface UltraChatbotAgentDocumentRecord {
  chatId: string | null;
  content: string | null;
  createdAt: string;
  id: string;
  kind: "code" | "image" | "sheet" | "text";
  title: string;
  visitorId: string;
}

interface UltraChatbotAgentDocumentDatabaseModule {
  database: typeof import("@workspace/database")["database"];
  ultraChatbotAgentDocuments: typeof import("@workspace/database")["ultraChatbotAgentDocuments"];
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeDocumentRecord(record: {
  chatId: string | null;
  content: string | null;
  createdAt: Date | string;
  id: string;
  kind: "code" | "image" | "sheet" | "text";
  title: string;
  visitorId: string;
}) {
  return {
    chatId: record.chatId,
    content: record.content,
    createdAt: toIsoString(record.createdAt),
    id: record.id,
    kind: record.kind,
    title: record.title,
    visitorId: record.visitorId,
  } satisfies UltraChatbotAgentDocumentRecord;
}

async function loadUltraChatbotAgentDocumentDatabase(): Promise<UltraChatbotAgentDocumentDatabaseModule> {
  const databaseModule = await import("@workspace/database");

  return {
    database: databaseModule.database,
    ultraChatbotAgentDocuments: databaseModule.ultraChatbotAgentDocuments,
  };
}

export function createUltraChatbotAgentDocumentStore() {
  return {
    async loadLatestDocument(input: {
      chatId: string;
      documentId: string;
      visitorId: string;
    }) {
      const versions = await this.listDocumentVersions(input);

      return versions[0] ?? null;
    },
    async listDocumentVersions(input: {
      chatId: string;
      documentId: string;
      visitorId: string;
    }) {
      const { database, ultraChatbotAgentDocuments } =
        await loadUltraChatbotAgentDocumentDatabase();
      const rows = await database
        .select()
        .from(ultraChatbotAgentDocuments)
        .where(
          and(
            eq(ultraChatbotAgentDocuments.chatId, input.chatId),
            eq(ultraChatbotAgentDocuments.id, input.documentId),
            eq(ultraChatbotAgentDocuments.visitorId, input.visitorId)
          )
        )
        .orderBy(desc(ultraChatbotAgentDocuments.createdAt));

      return rows.map(normalizeDocumentRecord);
    },
    async listLatestDocumentsForChat(input: {
      chatId: string;
      limit: number;
      visitorId: string;
    }) {
      const { database, ultraChatbotAgentDocuments } =
        await loadUltraChatbotAgentDocumentDatabase();
      const rows = await database
        .select()
        .from(ultraChatbotAgentDocuments)
        .where(
          and(
            eq(ultraChatbotAgentDocuments.chatId, input.chatId),
            eq(ultraChatbotAgentDocuments.visitorId, input.visitorId)
          )
        )
        .orderBy(desc(ultraChatbotAgentDocuments.createdAt));

      const latestById = new Map<string, UltraChatbotAgentDocumentRecord>();

      for (const row of rows) {
        if (latestById.has(row.id)) {
          continue;
        }

        latestById.set(row.id, normalizeDocumentRecord(row));

        if (latestById.size >= input.limit) {
          break;
        }
      }

      return [...latestById.values()];
    },
    async saveDocument(input: {
      chatId: string;
      content: string;
      documentId: string;
      kind: "code" | "image" | "sheet" | "text";
      title: string;
      visitorId: string;
    }) {
      const { database, ultraChatbotAgentDocuments } =
        await loadUltraChatbotAgentDocumentDatabase();
      const [row] = await database
        .insert(ultraChatbotAgentDocuments)
        .values({
          chatId: input.chatId,
          content: input.content,
          createdAt: new Date(),
          id: input.documentId,
          kind: input.kind,
          title: input.title,
          visitorId: input.visitorId,
        })
        .returning();

      if (!row) {
        throw new Error("Failed to save the ultra-chatbot-agent document.");
      }

      return normalizeDocumentRecord(row);
    },
    async deleteDocumentVersionsAfterTimestamp(input: {
      chatId: string;
      documentId: string;
      timestamp: Date;
      visitorId: string;
    }) {
      const { database, ultraChatbotAgentDocuments } =
        await loadUltraChatbotAgentDocumentDatabase();
      const deletedRows = await database
        .delete(ultraChatbotAgentDocuments)
        .where(
          and(
            eq(ultraChatbotAgentDocuments.chatId, input.chatId),
            eq(ultraChatbotAgentDocuments.id, input.documentId),
            eq(ultraChatbotAgentDocuments.visitorId, input.visitorId),
            gt(ultraChatbotAgentDocuments.createdAt, input.timestamp)
          )
        )
        .returning({ id: ultraChatbotAgentDocuments.id });

      return {
        deletedCount: deletedRows.length,
      };
    },
  };
}
