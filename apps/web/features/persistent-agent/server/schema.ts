import {
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const persistentAgentChats = pgTable(
  "persistent_agent_chats",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    visitorId: varchar("visitor_id", { length: 191 }).notNull(),
    title: text("title").notNull(),
    activeStreamId: varchar("active_stream_id", { length: 191 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    visitorUpdatedIndex: index("persistent_agent_chats_visitor_updated_idx").on(
      table.visitorId,
      table.updatedAt
    ),
  })
);

export const persistentAgentMessages = pgTable(
  "persistent_agent_messages",
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
    chatCreatedIndex: index("persistent_agent_messages_chat_created_idx").on(
      table.chatId,
      table.createdAt
    ),
    chatMessageIdIndex: uniqueIndex(
      "persistent_agent_messages_chat_message_id_idx"
    ).on(table.chatId, table.messageId),
    chatForeignKey: foreignKey({
      columns: [table.chatId],
      foreignColumns: [persistentAgentChats.id],
      name: "persistent_agent_messages_chat_fk",
    }).onDelete("cascade"),
  })
);

export const persistentAgentSchema = {
  persistentAgentChats,
  persistentAgentMessages,
} as const;
