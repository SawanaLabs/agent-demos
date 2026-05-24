import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";

export const customerMemoryThreads = pgTable(
  "customer_memory_threads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: varchar("customer_id", { length: 191 }).notNull(),
    visitorId: varchar("visitor_id", { length: 191 }).notNull(),
    title: text("title"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    customerIdIndex: index("customer_memory_threads_customer_id_idx").on(
      table.customerId
    ),
    customerVisitorIndex: index(
      "customer_memory_threads_customer_visitor_idx"
    ).on(table.customerId, table.visitorId),
  })
);

export const customerMemoryMessages = pgTable(
  "customer_memory_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    threadId: uuid("thread_id").notNull(),
    messageIndex: integer("message_index").notNull(),
    messageId: varchar("message_id", { length: 191 }).notNull(),
    role: varchar("role", { length: 32 }).notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    threadIndex: index("customer_memory_messages_thread_id_idx").on(
      table.threadId
    ),
    threadMessageIndex: uniqueIndex(
      "customer_memory_messages_thread_message_idx"
    ).on(table.threadId, table.messageIndex),
    threadMessageIdIndex: uniqueIndex(
      "customer_memory_messages_thread_message_id_idx"
    ).on(table.threadId, table.messageId),
    threadForeignKey: foreignKey({
      columns: [table.threadId],
      foreignColumns: [customerMemoryThreads.id],
      name: "cm_messages_thread_fk",
    }).onDelete("cascade"),
  })
);

export const customerMemoryMemories = pgTable(
  "customer_memory_memories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: varchar("customer_id", { length: 191 }).notNull(),
    visitorId: varchar("visitor_id", { length: 191 }).notNull(),
    threadId: uuid("thread_id"),
    sourceMessageId: varchar("source_message_id", { length: 191 }),
    category: varchar("category", { length: 64 }).notNull(),
    title: text("title"),
    content: text("content").notNull(),
    status: varchar("status", { length: 32 }).default("active").notNull(),
    metadata: jsonb("metadata"),
    lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
    accessCount: integer("access_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    customerIdIndex: index("customer_memory_memories_customer_id_idx").on(
      table.customerId
    ),
    customerVisitorIndex: index(
      "customer_memory_memories_customer_visitor_idx"
    ).on(table.customerId, table.visitorId, table.status),
    threadIndex: index("customer_memory_memories_thread_id_idx").on(
      table.threadId
    ),
    threadForeignKey: foreignKey({
      columns: [table.threadId],
      foreignColumns: [customerMemoryThreads.id],
      name: "cm_memories_thread_fk",
    }).onDelete("set null"),
  })
);

export const customerMemoryEvents = pgTable(
  "customer_memory_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memoryId: uuid("memory_id"),
    customerId: varchar("customer_id", { length: 191 }).notNull(),
    visitorId: varchar("visitor_id", { length: 191 }).notNull(),
    threadId: uuid("thread_id"),
    sourceMessageId: varchar("source_message_id", { length: 191 }),
    operation: varchar("operation", { length: 32 }).notNull(),
    reason: text("reason"),
    beforeContent: text("before_content"),
    afterContent: text("after_content"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    customerVisitorIndex: index(
      "customer_memory_events_customer_visitor_idx"
    ).on(table.customerId, table.visitorId),
    memoryIndex: index("customer_memory_events_memory_id_idx").on(
      table.memoryId
    ),
    threadIndex: index("customer_memory_events_thread_id_idx").on(
      table.threadId
    ),
    memoryForeignKey: foreignKey({
      columns: [table.memoryId],
      foreignColumns: [customerMemoryMemories.id],
      name: "cm_events_memory_fk",
    }).onDelete("set null"),
    threadForeignKey: foreignKey({
      columns: [table.threadId],
      foreignColumns: [customerMemoryThreads.id],
      name: "cm_events_thread_fk",
    }).onDelete("set null"),
  })
);

export const customerMemoryCompactions = pgTable(
  "customer_memory_compactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    threadId: uuid("thread_id").notNull(),
    messageCount: integer("message_count").notNull(),
    summary: text("summary").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    threadIndex: index("customer_memory_compactions_thread_id_idx").on(
      table.threadId
    ),
    threadCreatedAtIndex: uniqueIndex(
      "customer_memory_compactions_thread_created_at_idx"
    ).on(table.threadId, table.createdAt),
    threadForeignKey: foreignKey({
      columns: [table.threadId],
      foreignColumns: [customerMemoryThreads.id],
      name: "cm_compactions_thread_fk",
    }).onDelete("cascade"),
  })
);

export const customerMemoryEmbeddings = pgTable(
  "customer_memory_embeddings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memoryId: uuid("memory_id").notNull(),
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    memoryIndex: uniqueIndex("customer_memory_embeddings_memory_idx").on(
      table.memoryId
    ),
    embeddingIndex: index("customer_memory_embeddings_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
    memoryForeignKey: foreignKey({
      columns: [table.memoryId],
      foreignColumns: [customerMemoryMemories.id],
      name: "cm_embeddings_memory_fk",
    }).onDelete("cascade"),
  })
);
