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

function buildSourceAwareFallbackQuery(query: string) {
  return [
    query,
    ultraChatbotAgentKnowledgeSource.title,
    "NASA logotype seal symbol typography color red black visual identity design guidelines",
  ].join(" ");
}

async function retrieveWithSourceAwareFallback(input: {
  query: string;
  retrieve: (query: string) => Promise<RagToolResult>;
}) {
  const retrievalQueries = [input.query];
  const primaryResult = await input.retrieve(input.query);

  if (primaryResult.sources.length > 0) {
    return {
      result: primaryResult,
      retrievalQueries,
    };
  }

  const fallbackQuery = buildSourceAwareFallbackQuery(input.query);
  retrievalQueries.push(fallbackQuery);

  return {
    result: await input.retrieve(fallbackQuery),
    retrievalQueries,
  };
}

export function createUltraChatbotAgentSearchKnowledgeBaseTool(
  dependencies: {
    findRelevantContent?: (query: string) => Promise<RagToolResult>;
  } = {}
) {
  const retrieve = dependencies.findRelevantContent ?? findRelevantContent;

  return tool({
    description:
      "Search the preindexed PDF knowledge base and return grounded snippets plus citations for document questions. The active source is the NASA Graphics Standards Manual, so concrete retrieval terms include logotype, seal, typography, color, red, black, symbol, and visual identity.",
    inputSchema: searchKnowledgeBaseInputSchema,
    execute: async ({ query }) => {
      const { result, retrievalQueries } =
        await retrieveWithSourceAwareFallback({
          query,
          retrieve,
        });

      return {
        answerable: result.answerable,
        knowledgeSource: ultraChatbotAgentKnowledgeSource,
        message: result.message,
        query,
        retrievalQueries,
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
