import { generateObject, tool } from "ai";
import { z } from "zod";

import { createUltraChatbotAgentDocumentStore } from "./document-store";
import {
  findUltraChatbotAgentTargetDocument,
  getUltraChatbotAgentDocumentLookupError,
} from "./document-target";
import { getUltraChatbotAgentSuggestionSystemPrompt } from "./prompts";
import { createUltraChatbotAgentSuggestionStore } from "./suggestion-store";

const suggestionShapeSchema = z.object({
  description: z.string().trim().min(1),
  originalText: z.string().trim().min(1),
  suggestedText: z.string().trim().min(1),
});

const requestSuggestionsResultSchema = z.object({
  suggestions: z.array(suggestionShapeSchema).max(5),
});

const requestSuggestionsInputSchema = z.object({
  documentId: z.string().uuid().optional(),
  documentTitle: z.string().trim().min(1).optional(),
});

export function createUltraChatbotAgentRequestSuggestionsTool(input: {
  chatId: string;
  model: Parameters<typeof generateObject>[0]["model"];
  visitorId: string;
}) {
  return tool({
    description:
      "Request writing suggestions for an existing saved document. Use this only when the user explicitly asks to improve or review a document they already created in this chat workspace.",
    inputSchema: requestSuggestionsInputSchema,
    execute: async ({ documentId, documentTitle }) => {
      const documentStore = createUltraChatbotAgentDocumentStore();
      const latestDocuments = await documentStore.listLatestDocumentsForChat({
        chatId: input.chatId,
        limit: 24,
        visitorId: input.visitorId,
      });

      const matchedDocument = findUltraChatbotAgentTargetDocument({
        documentId,
        documentTitle,
        latestDocuments,
      });

      if (!matchedDocument?.content?.trim()) {
        return {
          error: getUltraChatbotAgentDocumentLookupError({
            documentId,
            documentTitle,
            documentsCount: latestDocuments.length,
          }),
        };
      }

      const response = await generateObject({
        model: input.model,
        prompt: matchedDocument.content,
        schema: requestSuggestionsResultSchema,
        system: getUltraChatbotAgentSuggestionSystemPrompt(),
      });

      const savedSuggestions =
        await createUltraChatbotAgentSuggestionStore().replaceSuggestionsForDocumentVersion(
          {
            documentCreatedAt: matchedDocument.createdAt,
            documentId: matchedDocument.id,
            suggestions: response.object.suggestions,
            visitorId: input.visitorId,
          }
        );

      return {
        id: matchedDocument.id,
        kind: matchedDocument.kind,
        suggestionCount: savedSuggestions.length,
        title: matchedDocument.title,
      };
    },
  });
}
