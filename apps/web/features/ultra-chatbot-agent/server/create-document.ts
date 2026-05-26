import { tool } from "ai";
import { z } from "zod";

import { createUltraChatbotAgentDocumentStore } from "./document-store";

const createDocumentInputSchema = z.object({
  content: z.string().trim().min(1),
  kind: z.enum(["code", "image", "sheet", "text"]),
  title: z.string().trim().min(1),
});

export function createUltraChatbotAgentCreateDocumentTool(input: {
  chatId: string;
  visitorId: string;
}) {
  return tool({
    description:
      "Create a persistent document artifact for the current visitor. Use this when the user explicitly asks you to draft, write, or create a document they may continue editing later.",
    inputSchema: createDocumentInputSchema,
    execute: async ({ content, kind, title }) => {
      const savedDocument =
        await createUltraChatbotAgentDocumentStore().saveDocument({
          chatId: input.chatId,
          content,
          documentId: crypto.randomUUID(),
          kind,
          title,
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
