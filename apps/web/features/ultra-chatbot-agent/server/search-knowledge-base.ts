import { tool } from "ai";
import { z } from "zod";

import {
  findRelevantContent,
  type RagToolResult,
} from "@/features/rag-chatbot/server/retrieval";

import { ultraChatbotAgentKnowledgeSource } from "../knowledge-source";

const searchKnowledgeBaseInputSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1)
    .describe(
      "The user question or retrieval query for the preindexed PDF knowledge base."
    ),
});

function toRenderableSources(result: RagToolResult) {
  return result.sources.map((source) => ({
    title: source.citationLabel,
    url: source.documentUrl,
  }));
}

export function createUltraChatbotAgentSearchKnowledgeBaseTool(dependencies: {
  findRelevantContent?: (query: string) => Promise<RagToolResult>;
} = {}) {
  const retrieve = dependencies.findRelevantContent ?? findRelevantContent;

  return tool({
    description:
      "Search the preindexed PDF knowledge base and return grounded snippets plus citations for document questions.",
    inputSchema: searchKnowledgeBaseInputSchema,
    execute: async ({ query }) => {
      const result = await retrieve(query);

      return {
        answerable: result.answerable,
        knowledgeSource: ultraChatbotAgentKnowledgeSource,
        message: result.message,
        query,
        snippets: result.sources.map((source) => ({
          citationLabel: source.citationLabel,
          content: source.content,
          documentUrl: source.documentUrl,
          pageLabel: source.pageLabel,
          sectionTitle: source.sectionTitle,
          similarity: source.similarity,
        })),
        sources: toRenderableSources(result),
      };
    },
  });
}
