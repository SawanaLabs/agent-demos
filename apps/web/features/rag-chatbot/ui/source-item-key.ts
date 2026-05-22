import type { RagToolSource } from "@/features/rag-chatbot/server/retrieval";

export function getSourceItemKey(
  messageId: string,
  source: RagToolSource,
  index: number
) {
  return [
    messageId,
    source.citationLabel,
    source.pageLabel ?? "no-page",
    source.sectionTitle ?? "no-section",
    source.content.slice(0, 96),
    index,
  ].join("::");
}
