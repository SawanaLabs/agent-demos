import { tool } from "ai";
import { z } from "zod";

import { createUltraChatbotAgentDocumentStore } from "./document-store";
import {
  findUltraChatbotAgentTargetDocument,
  getUltraChatbotAgentDocumentLookupError,
} from "./document-target";

const editDocumentInputSchema = z.object({
  documentId: z.string().uuid().optional(),
  documentTitle: z.string().trim().min(1).optional(),
  newText: z.string(),
  oldText: z.string().trim().min(1),
  replaceAll: z.boolean().optional().default(false),
});

export function createUltraChatbotAgentEditDocumentTool(input: {
  visitorId: string;
}) {
  return tool({
    description:
      "Make a targeted edit to an existing saved document by replacing exact text. Prefer this over updateDocument when the user asks for a small or local change.",
    inputSchema: editDocumentInputSchema,
    execute: async ({
      documentId,
      documentTitle,
      newText,
      oldText,
      replaceAll,
    }) => {
      const documentStore = createUltraChatbotAgentDocumentStore();
      const latestDocuments = await documentStore.listLatestDocumentsForVisitor({
        limit: 24,
        visitorId: input.visitorId,
      });
      const matchedDocument = findUltraChatbotAgentTargetDocument({
        documentId,
        documentTitle,
        latestDocuments,
      });

      if (!matchedDocument?.content) {
        return {
          error: getUltraChatbotAgentDocumentLookupError({
            documentId,
            documentTitle,
            documentsCount: latestDocuments.length,
          }),
        };
      }

      if (!matchedDocument.content.includes(oldText)) {
        return {
          error: `Could not find "${oldText}" in "${matchedDocument.title}".`,
        };
      }

      const nextContent = replaceAll
        ? matchedDocument.content.replaceAll(oldText, newText)
        : matchedDocument.content.replace(oldText, newText);

      const savedDocument = await documentStore.saveDocument({
        content: nextContent,
        documentId: matchedDocument.id,
        kind: matchedDocument.kind,
        title: matchedDocument.title,
        visitorId: input.visitorId,
      });

      return {
        id: savedDocument.id,
        kind: savedDocument.kind,
        title: savedDocument.title,
      };
    },
  });
}
