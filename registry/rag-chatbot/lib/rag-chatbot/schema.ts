import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

export const ragChatbotResources = pgTable(
  "rag_chatbot_resources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sourceSlug: varchar("source_slug", { length: 191 }).notNull(),
    title: text("title").notNull(),
    sourcePageUrl: text("source_page_url").notNull(),
    documentUrl: text("document_url").notNull(),
    description: text("description"),
    contentHash: varchar("content_hash", { length: 128 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sourceSlugIndex: uniqueIndex("rag_chatbot_resources_source_slug_idx").on(
      table.sourceSlug
    ),
  })
);

export const ragChatbotEmbeddings = pgTable(
  "rag_chatbot_embeddings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => ragChatbotResources.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    pageLabel: varchar("page_label", { length: 64 }),
    sectionTitle: text("section_title"),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    chunkIndex: uniqueIndex("rag_chatbot_embeddings_resource_chunk_idx").on(
      table.resourceId,
      table.chunkIndex
    ),
    embeddingIndex: index("rag_chatbot_embeddings_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  })
);

export const ragChatbotSchema = {
  ragChatbotEmbeddings,
  ragChatbotResources,
};
