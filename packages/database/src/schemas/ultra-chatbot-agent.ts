import {
  boolean,
  foreignKey,
  index,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const ultraChatbotAgentVisibilityTypes = ["public", "private"] as const;
export const ultraChatbotAgentDocumentKinds = [
  "text",
  "code",
  "image",
  "sheet",
] as const;

export const ultraChatbotAgentChats = pgTable(
  "ultra_chatbot_agent_chats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visitorId: varchar("visitor_id", { length: 191 }).notNull(),
    title: text("title").notNull(),
    selectedChatModel: varchar("selected_chat_model", { length: 191 }).notNull(),
    visibility: varchar("visibility", {
      enum: ultraChatbotAgentVisibilityTypes,
      length: 32,
    })
      .notNull()
      .default("private"),
    activeStreamId: varchar("active_stream_id", { length: 191 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    visitorUpdatedIndex: index(
      "ultra_chatbot_agent_chats_visitor_updated_idx"
    ).on(table.visitorId, table.updatedAt),
  })
);

export const ultraChatbotAgentMessages = pgTable(
  "ultra_chatbot_agent_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chatId: uuid("chat_id").notNull(),
    messageId: varchar("message_id", { length: 191 }).notNull(),
    role: varchar("role", { length: 32 }).notNull(),
    parts: jsonb("parts").notNull(),
    attachments: jsonb("attachments").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    chatCreatedIndex: index(
      "ultra_chatbot_agent_messages_chat_created_idx"
    ).on(table.chatId, table.createdAt),
    chatMessageIdIndex: uniqueIndex(
      "ultra_chatbot_agent_messages_chat_message_id_idx"
    ).on(table.chatId, table.messageId),
    chatForeignKey: foreignKey({
      columns: [table.chatId],
      foreignColumns: [ultraChatbotAgentChats.id],
      name: "ultra_chatbot_agent_messages_chat_fk",
    }).onDelete("cascade"),
  })
);

export const ultraChatbotAgentVotes = pgTable(
  "ultra_chatbot_agent_votes",
  {
    chatId: uuid("chat_id").notNull(),
    messageId: varchar("message_id", { length: 191 }).notNull(),
    visitorId: varchar("visitor_id", { length: 191 }).notNull(),
    isUpvoted: boolean("is_upvoted").notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      columns: [table.chatId, table.messageId, table.visitorId],
      name: "ultra_chatbot_agent_votes_pk",
    }),
  })
);

export const ultraChatbotAgentDocuments = pgTable(
  "ultra_chatbot_agent_documents",
  {
    id: uuid("id").notNull().defaultRandom(),
    visitorId: varchar("visitor_id", { length: 191 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("kind", {
      enum: ultraChatbotAgentDocumentKinds,
      length: 32,
    })
      .notNull()
      .default("text"),
  },
  (table) => ({
    primaryKey: primaryKey({
      columns: [table.id, table.createdAt],
      name: "ultra_chatbot_agent_documents_pk",
    }),
  })
);

export const ultraChatbotAgentSuggestions = pgTable(
  "ultra_chatbot_agent_suggestions",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("document_id").notNull(),
    documentCreatedAt: timestamp("document_created_at", {
      withTimezone: true,
    }).notNull(),
    visitorId: varchar("visitor_id", { length: 191 }).notNull(),
    originalText: text("original_text").notNull(),
    suggestedText: text("suggested_text").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      columns: [table.id],
      name: "ultra_chatbot_agent_suggestions_pk",
    }),
    documentForeignKey: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [
        ultraChatbotAgentDocuments.id,
        ultraChatbotAgentDocuments.createdAt,
      ],
      name: "ultra_chatbot_agent_suggestions_document_fk",
    }).onDelete("cascade"),
  })
);

export const ultraChatbotAgentStreams = pgTable(
  "ultra_chatbot_agent_streams",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chat_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({
      columns: [table.id],
      name: "ultra_chatbot_agent_streams_pk",
    }),
    chatForeignKey: foreignKey({
      columns: [table.chatId],
      foreignColumns: [ultraChatbotAgentChats.id],
      name: "ultra_chatbot_agent_streams_chat_fk",
    }).onDelete("cascade"),
  })
);
