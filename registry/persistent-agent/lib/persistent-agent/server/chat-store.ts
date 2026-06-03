import { and, asc, desc, eq, lt } from "drizzle-orm";
import type { UIMessage } from "ai";
import {
  persistentAgentChats,
  persistentAgentMessages,
} from "./schema";
import { getPersistentAgentEnv } from "./env";
import { createPortablePersistentAgentChatPersistence } from "./portable-store";

const maxPersistentAgentTitleLength = 72;

export const persistentAgentCleanupCronScheduleUtc = "0 20 * * *";
export const persistentAgentCleanupRetentionDays = 7;

export interface PersistentAgentChatRecord {
  activeStreamId: string | null;
  createdAt: string;
  id: string;
  title: string;
  updatedAt: string;
  visitorId: string;
}

export interface PersistentAgentChatSession {
  chat: PersistentAgentChatRecord;
  messages: UIMessage[];
}

export interface PersistentAgentChatPersistence {
  listChatsForVisitor(visitorId: string): Promise<PersistentAgentChatRecord[]>;
  loadChatSession(
    chatId: string,
    visitorId: string
  ): Promise<PersistentAgentChatSession | null>;
  saveIncomingUserMessage(input: {
    chatId: string;
    message: UIMessage;
    visitorId: string;
  }): Promise<void>;
  saveFinishedMessages(input: {
    chatId: string;
    messages: UIMessage[];
    visitorId: string;
  }): Promise<void>;
  setActiveStream(input: {
    activeStreamId: string | null;
    chatId: string;
    visitorId: string;
  }): Promise<void>;
  cleanupExpiredChats(input?: { now?: Date }): Promise<{
    deletedChats: number;
    expiresBefore: string;
  }>;
}

interface PersistentAgentChatStoreDependencies {
  persistence?: PersistentAgentChatPersistence;
}

type PersistentAgentDatabaseModule = Awaited<
  ReturnType<typeof import("./database")["loadPersistentAgentDatabase"]>
>;

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function normalizeChatRecord(record: {
  activeStreamId: string | null;
  createdAt: Date | string;
  id: string;
  title: string;
  updatedAt: Date | string;
  visitorId: string;
}): PersistentAgentChatRecord {
  return {
    activeStreamId: record.activeStreamId,
    createdAt: toIsoString(record.createdAt),
    id: record.id,
    title: record.title,
    updatedAt: toIsoString(record.updatedAt),
    visitorId: record.visitorId,
  };
}

async function loadPersistentAgentDatabase(): Promise<PersistentAgentDatabaseModule> {
  return import("./database").then((module) => module.loadPersistentAgentDatabase());
}

function getMessageText(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .filter((part) => part.length > 0)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildChatTitle(message: UIMessage) {
  const text = getMessageText(message);

  if (text.length === 0) {
    return "New chat";
  }

  return text.slice(0, maxPersistentAgentTitleLength);
}

function readMessageCreatedAt(message: UIMessage, fallback: Date) {
  const metadata = message.metadata as { createdAt?: string } | undefined;

  if (!metadata?.createdAt) {
    return fallback;
  }

  const createdAt = new Date(metadata.createdAt);

  return Number.isNaN(createdAt.valueOf()) ? fallback : createdAt;
}

function toUiMessage(row: {
  createdAt: Date | string;
  messageId: string;
  parts: unknown;
  role: string;
}) {
  return {
    id: row.messageId,
    metadata: {
      createdAt: toIsoString(row.createdAt),
    },
    parts: row.parts as UIMessage["parts"],
    role: row.role as UIMessage["role"],
  } satisfies UIMessage;
}

export function getPersistentAgentChatNotFoundError(chatId: string) {
  return `No persistent-agent chat found for ${chatId}.`;
}

function isInvalidPersistentAgentChatIdError(error: unknown) {
  const candidates =
    error instanceof Error
      ? [error, (error as Error & { cause?: unknown }).cause]
      : [error];

  return candidates.some((candidate) => {
    if (!(candidate instanceof Error)) {
      return false;
    }

    const candidateWithCode = candidate as Error & { code?: string };

    return (
      candidateWithCode.code === "22P02" ||
      candidate.message.includes("invalid input syntax for type uuid")
    );
  });
}

function createDatabaseBackedPersistentAgentChatPersistence(): PersistentAgentChatPersistence {
  return {
    async listChatsForVisitor(visitorId: string) {
      const { database, persistentAgentChats } =
        await loadPersistentAgentDatabase();
      const rows = await database
        .select()
        .from(persistentAgentChats)
        .where(eq(persistentAgentChats.visitorId, visitorId))
        .orderBy(desc(persistentAgentChats.updatedAt));

      return rows.map(normalizeChatRecord);
    },
    async loadChatSession(
      chatId: string,
      visitorId: string
    ): Promise<PersistentAgentChatSession | null> {
      try {
        const { database, persistentAgentChats, persistentAgentMessages } =
          await loadPersistentAgentDatabase();
        const [chat] = await database
          .select()
          .from(persistentAgentChats)
          .where(
            and(
              eq(persistentAgentChats.id, chatId),
              eq(persistentAgentChats.visitorId, visitorId)
            )
          )
          .limit(1);

        if (!chat) {
          return null;
        }

        const rows = await database
          .select()
          .from(persistentAgentMessages)
          .where(eq(persistentAgentMessages.chatId, chatId))
          .orderBy(asc(persistentAgentMessages.createdAt));

        return {
          chat: normalizeChatRecord(chat),
          messages: rows.map(toUiMessage),
        };
      } catch (error) {
        if (isInvalidPersistentAgentChatIdError(error)) {
          return null;
        }

        throw error;
      }
    },
    async saveIncomingUserMessage(input: {
      chatId: string;
      message: UIMessage;
      visitorId: string;
    }) {
      const { database, persistentAgentChats, persistentAgentMessages } =
        await loadPersistentAgentDatabase();
      const now = new Date();
      const title = buildChatTitle(input.message);

      await database.transaction(async (tx) => {
        const [existingChat] = await tx
          .select()
          .from(persistentAgentChats)
          .where(eq(persistentAgentChats.id, input.chatId))
          .limit(1);

        if (existingChat && existingChat.visitorId !== input.visitorId) {
          throw new Error(getPersistentAgentChatNotFoundError(input.chatId));
        }

        if (existingChat) {
          await tx
            .update(persistentAgentChats)
            .set({
              activeStreamId: null,
              title:
                existingChat.title === "New chat" && title !== "New chat"
                  ? title
                  : existingChat.title,
              updatedAt: now,
            })
            .where(eq(persistentAgentChats.id, input.chatId));
        } else {
          await tx.insert(persistentAgentChats).values({
            activeStreamId: null,
            id: input.chatId,
            title,
            updatedAt: now,
            visitorId: input.visitorId,
          });
        }

        await tx
          .insert(persistentAgentMessages)
          .values({
            attachments: [],
            chatId: input.chatId,
            createdAt: readMessageCreatedAt(input.message, now),
            messageId: input.message.id,
            parts: input.message.parts,
            role: input.message.role,
          })
          .onConflictDoUpdate({
            set: {
              parts: input.message.parts,
              role: input.message.role,
            },
            target: [
              persistentAgentMessages.chatId,
              persistentAgentMessages.messageId,
            ],
          });
      });
    },
    async saveFinishedMessages(input: {
      chatId: string;
      messages: UIMessage[];
      visitorId: string;
    }) {
      const { database, persistentAgentChats, persistentAgentMessages } =
        await loadPersistentAgentDatabase();
      const now = new Date();

      await database.transaction(async (tx) => {
        const [chat] = await tx
          .select()
          .from(persistentAgentChats)
          .where(
            and(
              eq(persistentAgentChats.id, input.chatId),
              eq(persistentAgentChats.visitorId, input.visitorId)
            )
          )
          .limit(1);

        if (!chat) {
          throw new Error(getPersistentAgentChatNotFoundError(input.chatId));
        }

        if (input.messages.length > 0) {
          await tx
            .insert(persistentAgentMessages)
            .values(
              input.messages.map((message) => ({
                attachments: [],
                chatId: input.chatId,
                createdAt: readMessageCreatedAt(message, now),
                messageId: message.id,
                parts: message.parts,
                role: message.role,
              }))
            )
            .onConflictDoNothing({
              target: [
                persistentAgentMessages.chatId,
                persistentAgentMessages.messageId,
              ],
            });
        }

        await tx
          .update(persistentAgentChats)
          .set({
            activeStreamId: null,
            updatedAt: now,
          })
          .where(eq(persistentAgentChats.id, input.chatId));
      });
    },
    async setActiveStream(input: {
      activeStreamId: string | null;
      chatId: string;
      visitorId: string;
    }) {
      const { database, persistentAgentChats } =
        await loadPersistentAgentDatabase();
      const rows = await database
        .update(persistentAgentChats)
        .set({
          activeStreamId: input.activeStreamId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(persistentAgentChats.id, input.chatId),
            eq(persistentAgentChats.visitorId, input.visitorId)
          )
        )
        .returning({ id: persistentAgentChats.id });

      if (rows.length === 0) {
        throw new Error(getPersistentAgentChatNotFoundError(input.chatId));
      }
    },
    async cleanupExpiredChats(input?: { now?: Date }) {
      const { database, persistentAgentChats } =
        await loadPersistentAgentDatabase();
      const now = input?.now ?? new Date();
      const expiresBefore = new Date(
        now.getTime() -
          persistentAgentCleanupRetentionDays * 24 * 60 * 60 * 1000
      );
      const expiredChats = await database
        .select({ id: persistentAgentChats.id })
        .from(persistentAgentChats)
        .where(lt(persistentAgentChats.updatedAt, expiresBefore));

      if (expiredChats.length === 0) {
        return {
          deletedChats: 0,
          expiresBefore: expiresBefore.toISOString(),
        };
      }

      const deletedChats = await database
        .delete(persistentAgentChats)
        .where(lt(persistentAgentChats.updatedAt, expiresBefore))
        .returning({ id: persistentAgentChats.id });

      return {
        deletedChats: deletedChats.length,
        expiresBefore: expiresBefore.toISOString(),
      };
    },
  };
}

export function createPersistentAgentChatStore(
  dependencies: PersistentAgentChatStoreDependencies = {}
) {
  return (
    dependencies.persistence ??
    (getPersistentAgentEnv().DATABASE_URL
      ? createDatabaseBackedPersistentAgentChatPersistence()
      : createPortablePersistentAgentChatPersistence())
  );
}
