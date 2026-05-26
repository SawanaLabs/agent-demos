import { and, asc, eq } from "@workspace/database/drizzle";

export interface UltraChatbotAgentSuggestionRecord {
  createdAt: string;
  description: string | null;
  documentCreatedAt: string;
  documentId: string;
  id: string;
  originalText: string;
  suggestedText: string;
  visitorId: string;
}

interface UltraChatbotAgentSuggestionDatabaseModule {
  database: typeof import("@workspace/database")["database"];
  ultraChatbotAgentSuggestions: typeof import("@workspace/database")["ultraChatbotAgentSuggestions"];
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeSuggestionRecord(record: {
  createdAt: Date | string;
  description: string | null;
  documentCreatedAt: Date | string;
  documentId: string;
  id: string;
  originalText: string;
  suggestedText: string;
  visitorId: string;
}) {
  return {
    createdAt: toIsoString(record.createdAt),
    description: record.description,
    documentCreatedAt: toIsoString(record.documentCreatedAt),
    documentId: record.documentId,
    id: record.id,
    originalText: record.originalText,
    suggestedText: record.suggestedText,
    visitorId: record.visitorId,
  } satisfies UltraChatbotAgentSuggestionRecord;
}

async function loadUltraChatbotAgentSuggestionDatabase(): Promise<UltraChatbotAgentSuggestionDatabaseModule> {
  const databaseModule = await import("@workspace/database");

  return {
    database: databaseModule.database,
    ultraChatbotAgentSuggestions: databaseModule.ultraChatbotAgentSuggestions,
  };
}

export function createUltraChatbotAgentSuggestionStore() {
  return {
    async listSuggestionsForDocumentVersion(input: {
      documentCreatedAt: string;
      documentId: string;
      visitorId: string;
    }) {
      const { database, ultraChatbotAgentSuggestions } =
        await loadUltraChatbotAgentSuggestionDatabase();
      const rows = await database
        .select()
        .from(ultraChatbotAgentSuggestions)
        .where(
          and(
            eq(ultraChatbotAgentSuggestions.documentId, input.documentId),
            eq(
              ultraChatbotAgentSuggestions.documentCreatedAt,
              new Date(input.documentCreatedAt)
            ),
            eq(ultraChatbotAgentSuggestions.visitorId, input.visitorId)
          )
        )
        .orderBy(asc(ultraChatbotAgentSuggestions.createdAt));

      return rows.map(normalizeSuggestionRecord);
    },
    async replaceSuggestionsForDocumentVersion(input: {
      documentCreatedAt: string;
      documentId: string;
      suggestions: Array<{
        description: string | null;
        originalText: string;
        suggestedText: string;
      }>;
      visitorId: string;
    }) {
      const { database, ultraChatbotAgentSuggestions } =
        await loadUltraChatbotAgentSuggestionDatabase();

      await database
        .delete(ultraChatbotAgentSuggestions)
        .where(
          and(
            eq(ultraChatbotAgentSuggestions.documentId, input.documentId),
            eq(
              ultraChatbotAgentSuggestions.documentCreatedAt,
              new Date(input.documentCreatedAt)
            ),
            eq(ultraChatbotAgentSuggestions.visitorId, input.visitorId)
          )
        );

      if (input.suggestions.length === 0) {
        return [] satisfies UltraChatbotAgentSuggestionRecord[];
      }

      const createdAt = new Date();
      const rows = await database
        .insert(ultraChatbotAgentSuggestions)
        .values(
          input.suggestions.map((suggestion) => ({
            createdAt,
            description: suggestion.description,
            documentCreatedAt: new Date(input.documentCreatedAt),
            documentId: input.documentId,
            id: crypto.randomUUID(),
            originalText: suggestion.originalText,
            suggestedText: suggestion.suggestedText,
            visitorId: input.visitorId,
          }))
        )
        .returning();

      return rows.map(normalizeSuggestionRecord);
    },
  };
}
