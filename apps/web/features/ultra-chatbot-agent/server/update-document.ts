import { generateText, tool } from "ai";
import { z } from "zod";

import { createUltraChatbotAgentDocumentStore } from "./document-store";
import {
  findUltraChatbotAgentTargetDocument,
  getUltraChatbotAgentDocumentLookupError,
} from "./document-target";
import { getUltraChatbotAgentDocumentRewriteSystemPrompt } from "./prompts";

const updateDocumentInputSchema = z.object({
  description: z.string().trim().min(1),
  documentId: z.string().uuid().optional(),
  documentTitle: z.string().trim().min(1).optional(),
});

export function createUltraChatbotAgentUpdateDocumentTool(input: {
  chatId: string;
  model: Parameters<typeof generateText>[0]["model"];
  visitorId: string;
}) {
  return tool({
    description:
      "Rewrite an existing saved document more broadly from a change description. Use this when the user asks for a larger refresh or major rewrite, and prefer editDocument for small exact replacements.",
    inputSchema: updateDocumentInputSchema,
    execute: async ({ description, documentId, documentTitle }) => {
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

      if (!matchedDocument?.content) {
        return {
          error: getUltraChatbotAgentDocumentLookupError({
            documentId,
            documentTitle,
            documentsCount: latestDocuments.length,
          }),
        };
      }

      const response = await generateText({
        model: input.model,
        prompt: [
          `Document title: ${matchedDocument.title}`,
          `Document kind: ${matchedDocument.kind}`,
          `Requested rewrite: ${description}`,
          "Current content:",
          matchedDocument.content,
        ].join("\n\n"),
        system: getUltraChatbotAgentDocumentRewriteSystemPrompt(),
      });

      const nextContent = response.text.trim();

      if (!nextContent) {
        throw new Error("The model returned an empty document rewrite.");
      }

      const savedDocument = await documentStore.saveDocument({
        chatId: input.chatId,
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
