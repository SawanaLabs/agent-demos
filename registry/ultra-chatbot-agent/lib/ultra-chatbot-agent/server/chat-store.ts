import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  lt,
} from "drizzle-orm";
import type { UIMessage } from "ai";

import { loadUltraChatbotAgentDatabase as loadUltraChatbotAgentDatabaseModule } from "./database";
import { demoDataRetentionDays } from "./demo-data-retention-policy";

import {
  getUltraChatbotAgentDefaultCapabilities,
  normalizeUltraChatbotAgentCapabilities,
  type UltraChatbotAgentCapabilities,
} from "./capabilities";

export interface UltraChatbotAgentChatRecord {
  activeStreamId: string | null;
  capabilities: UltraChatbotAgentCapabilities;
  createdAt: string;
  id: string;
  selectedChatModel: string;
  title: string;
  updatedAt: string;
  visibility: "private" | "public";
  visitorId: string;
}

export interface UltraChatbotAgentChatSession {
  chat: UltraChatbotAgentChatRecord;
  messages: UIMessage[];
}

export interface UltraChatbotAgentHistoryPage {
  chats: UltraChatbotAgentChatRecord[];
  hasMore: boolean;
}

export interface UltraChatbotAgentVoteRecord {
  chatId: string;
  isUpvoted: boolean;
  messageId: string;
  visitorId: string;
}

export const ultraChatbotAgentCleanupRetentionDays = demoDataRetentionDays;

export interface UltraChatbotAgentExpiredChatRecord {
  id: string;
  updatedAt: string;
}

export interface UltraChatbotAgentChatCleanupResult {
  chatIds: string[];
  deletedChats: number;
  deletedVotes: number;
  expiresBefore: string;
  retentionDays: number;
}

export interface UltraChatbotAgentChatCleanupPersistence {
  deleteExpiredChatsByIds(chatIds: string[]): Promise<{
    deletedChats: number;
    deletedVotes: number;
  }>;
  findExpiredChats(input: {
    olderThan: Date;
  }): Promise<UltraChatbotAgentExpiredChatRecord[]>;
}

interface UltraChatbotAgentDatabaseModule {
  database: typeof import("./database")["database"];
  ultraChatbotAgentChats: typeof import("./database")["ultraChatbotAgentChats"];
  ultraChatbotAgentMessages: typeof import("./database")["ultraChatbotAgentMessages"];
  ultraChatbotAgentVotes: typeof import("./database")["ultraChatbotAgentVotes"];
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function subtractDays(date: Date, days: number) {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

function normalizeChatRecord(record: {
  activeStreamId: string | null;
  capabilities: unknown;
  createdAt: Date | string;
  id: string;
  selectedChatModel: string;
  title: string;
  updatedAt: Date | string;
  visibility: "private" | "public";
  visitorId: string;
}) {
  return {
    activeStreamId: record.activeStreamId,
    capabilities: normalizeUltraChatbotAgentCapabilities(record.capabilities),
    createdAt: toIsoString(record.createdAt),
    id: record.id,
    selectedChatModel: record.selectedChatModel,
    title: record.title,
    updatedAt: toIsoString(record.updatedAt),
    visibility: record.visibility,
    visitorId: record.visitorId,
  } satisfies UltraChatbotAgentChatRecord;
}

async function loadUltraChatbotAgentChatDatabase(): Promise<UltraChatbotAgentDatabaseModule> {
  const databaseModule = await loadUltraChatbotAgentDatabaseModule();

  return {
    database: databaseModule.database,
    ultraChatbotAgentChats: databaseModule.ultraChatbotAgentChats,
    ultraChatbotAgentMessages: databaseModule.ultraChatbotAgentMessages,
    ultraChatbotAgentVotes: databaseModule.ultraChatbotAgentVotes,
  };
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

  return text.slice(0, 72);
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

function getStoredAttachments(message: UIMessage) {
  return message.parts
    .filter(
      (part): part is Extract<UIMessage["parts"][number], { type: "file" }> =>
        part.type === "file" && typeof part.url === "string"
    )
    .map((part) => ({
      filename: part.filename ?? null,
      mediaType: part.mediaType ?? null,
      url: part.url,
    }));
}

export function getUltraChatbotAgentChatNotFoundError(chatId: string) {
  return `No ultra-chatbot-agent chat found for ${chatId}.`;
}

function isInvalidUltraChatbotAgentChatIdError(error: unknown) {
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

function createDatabaseBackedUltraChatbotAgentChatCleanupPersistence(): UltraChatbotAgentChatCleanupPersistence {
  return {
    async deleteExpiredChatsByIds(chatIds) {
      if (chatIds.length === 0) {
        return {
          deletedChats: 0,
          deletedVotes: 0,
        };
      }

      const { database, ultraChatbotAgentChats, ultraChatbotAgentVotes } =
        await loadUltraChatbotAgentChatDatabase();

      return database.transaction(async (tx) => {
        const deletedVotes = await tx
          .delete(ultraChatbotAgentVotes)
          .where(inArray(ultraChatbotAgentVotes.chatId, chatIds))
          .returning({
            chatId: ultraChatbotAgentVotes.chatId,
            messageId: ultraChatbotAgentVotes.messageId,
            visitorId: ultraChatbotAgentVotes.visitorId,
          });
        const deletedChats = await tx
          .delete(ultraChatbotAgentChats)
          .where(inArray(ultraChatbotAgentChats.id, chatIds))
          .returning({ id: ultraChatbotAgentChats.id });

        return {
          deletedChats: deletedChats.length,
          deletedVotes: deletedVotes.length,
        };
      });
    },
    async findExpiredChats(input) {
      const { database, ultraChatbotAgentChats } =
        await loadUltraChatbotAgentChatDatabase();
      const rows = await database
        .select({
          id: ultraChatbotAgentChats.id,
          updatedAt: ultraChatbotAgentChats.updatedAt,
        })
        .from(ultraChatbotAgentChats)
        .where(lt(ultraChatbotAgentChats.updatedAt, input.olderThan));

      return rows.map((row) => ({
        id: row.id,
        updatedAt: toIsoString(row.updatedAt),
      }));
    },
  };
}

export async function cleanupExpiredUltraChatbotAgentChats(
  input: {
    now?: Date;
    retentionDays?: number;
  } = {},
  dependencies: {
    persistence?: UltraChatbotAgentChatCleanupPersistence;
  } = {}
): Promise<UltraChatbotAgentChatCleanupResult> {
  const now = input.now ?? new Date();
  const retentionDays =
    input.retentionDays ?? ultraChatbotAgentCleanupRetentionDays;
  const expiresBefore = subtractDays(now, retentionDays);
  const persistence =
    dependencies.persistence ??
    createDatabaseBackedUltraChatbotAgentChatCleanupPersistence();
  const expiredChats = await persistence.findExpiredChats({
    olderThan: expiresBefore,
  });
  const chatIds = expiredChats.map((chat) => chat.id);

  if (chatIds.length === 0) {
    return {
      chatIds: [],
      deletedChats: 0,
      deletedVotes: 0,
      expiresBefore: expiresBefore.toISOString(),
      retentionDays,
    };
  }

  const { deletedChats, deletedVotes } =
    await persistence.deleteExpiredChatsByIds(chatIds);

  return {
    chatIds,
    deletedChats,
    deletedVotes,
    expiresBefore: expiresBefore.toISOString(),
    retentionDays,
  };
}

export function createUltraChatbotAgentChatStore() {
  return {
    async listChatsForVisitor(visitorId: string) {
      const { database, ultraChatbotAgentChats } =
        await loadUltraChatbotAgentChatDatabase();
      const rows = await database
        .select()
        .from(ultraChatbotAgentChats)
        .where(eq(ultraChatbotAgentChats.visitorId, visitorId))
        .orderBy(desc(ultraChatbotAgentChats.updatedAt));

      return rows.map(normalizeChatRecord);
    },
    async loadChatSession(
      chatId: string,
      visitorId: string
    ): Promise<UltraChatbotAgentChatSession | null> {
      try {
        const { database, ultraChatbotAgentChats, ultraChatbotAgentMessages } =
          await loadUltraChatbotAgentChatDatabase();
        const [chat] = await database
          .select()
          .from(ultraChatbotAgentChats)
          .where(
            and(
              eq(ultraChatbotAgentChats.id, chatId),
              eq(ultraChatbotAgentChats.visitorId, visitorId)
            )
          )
          .limit(1);

        if (!chat) {
          return null;
        }

        const rows = await database
          .select()
          .from(ultraChatbotAgentMessages)
          .where(eq(ultraChatbotAgentMessages.chatId, chatId))
          .orderBy(asc(ultraChatbotAgentMessages.createdAt));

        return {
          chat: normalizeChatRecord(chat),
          messages: rows.map(toUiMessage),
        };
      } catch (error) {
        if (isInvalidUltraChatbotAgentChatIdError(error)) {
          return null;
        }

        throw error;
      }
    },
    async listVotesForChat(input: {
      chatId: string;
      visitorId: string;
    }): Promise<UltraChatbotAgentVoteRecord[]> {
      const { database, ultraChatbotAgentVotes } =
        await loadUltraChatbotAgentChatDatabase();
      const rows = await database
        .select()
        .from(ultraChatbotAgentVotes)
        .where(
          and(
            eq(ultraChatbotAgentVotes.chatId, input.chatId),
            eq(ultraChatbotAgentVotes.visitorId, input.visitorId)
          )
        );

      return rows;
    },
    async listChatsForVisitorPage(input: {
      endingBefore: string | null;
      limit: number;
      startingAfter: string | null;
      visitorId: string;
    }): Promise<UltraChatbotAgentHistoryPage> {
      const { database, ultraChatbotAgentChats } =
        await loadUltraChatbotAgentChatDatabase();
      const extendedLimit = input.limit + 1;

      const loadAnchor = async (chatId: string) => {
        const [anchor] = await database
          .select({
            createdAt: ultraChatbotAgentChats.createdAt,
            id: ultraChatbotAgentChats.id,
          })
          .from(ultraChatbotAgentChats)
          .where(
            and(
              eq(ultraChatbotAgentChats.id, chatId),
              eq(ultraChatbotAgentChats.visitorId, input.visitorId)
            )
          )
          .limit(1);

        return anchor ?? null;
      };

      let rows: (typeof ultraChatbotAgentChats.$inferSelect)[] = [];

      if (input.startingAfter) {
        const anchor = await loadAnchor(input.startingAfter);

        if (!anchor) {
          return {
            chats: [],
            hasMore: false,
          };
        }

        rows = await database
          .select()
          .from(ultraChatbotAgentChats)
          .where(
            and(
              eq(ultraChatbotAgentChats.visitorId, input.visitorId),
              gt(ultraChatbotAgentChats.createdAt, anchor.createdAt)
            )
          )
          .orderBy(desc(ultraChatbotAgentChats.createdAt))
          .limit(extendedLimit);
      } else if (input.endingBefore) {
        const anchor = await loadAnchor(input.endingBefore);

        if (!anchor) {
          return {
            chats: [],
            hasMore: false,
          };
        }

        rows = await database
          .select()
          .from(ultraChatbotAgentChats)
          .where(
            and(
              eq(ultraChatbotAgentChats.visitorId, input.visitorId),
              lt(ultraChatbotAgentChats.createdAt, anchor.createdAt)
            )
          )
          .orderBy(desc(ultraChatbotAgentChats.createdAt))
          .limit(extendedLimit);
      } else {
        rows = await database
          .select()
          .from(ultraChatbotAgentChats)
          .where(eq(ultraChatbotAgentChats.visitorId, input.visitorId))
          .orderBy(desc(ultraChatbotAgentChats.createdAt))
          .limit(extendedLimit);
      }

      const hasMore = rows.length > input.limit;

      return {
        chats: rows.slice(0, input.limit).map(normalizeChatRecord),
        hasMore,
      };
    },
    async saveIncomingUserMessage(input: {
      chatId: string;
      message: UIMessage;
      selectedChatModel: string;
      selectedVisibilityType: "private" | "public";
      visitorId: string;
    }) {
      const { database, ultraChatbotAgentChats, ultraChatbotAgentMessages } =
        await loadUltraChatbotAgentChatDatabase();
      const now = new Date();
      const title = buildChatTitle(input.message);

      await database.transaction(async (tx) => {
        const [existingChat] = await tx
          .select()
          .from(ultraChatbotAgentChats)
          .where(eq(ultraChatbotAgentChats.id, input.chatId))
          .limit(1);

        if (existingChat && existingChat.visitorId !== input.visitorId) {
          throw new Error(getUltraChatbotAgentChatNotFoundError(input.chatId));
        }

        if (existingChat) {
          await tx
            .update(ultraChatbotAgentChats)
            .set({
              activeStreamId: null,
              selectedChatModel: input.selectedChatModel,
              title:
                existingChat.title === "New chat" && title !== "New chat"
                  ? title
                  : existingChat.title,
              updatedAt: now,
              visibility: input.selectedVisibilityType,
            })
            .where(eq(ultraChatbotAgentChats.id, input.chatId));
        } else {
          await tx.insert(ultraChatbotAgentChats).values({
            activeStreamId: null,
            capabilities: getUltraChatbotAgentDefaultCapabilities(),
            id: input.chatId,
            selectedChatModel: input.selectedChatModel,
            title,
            updatedAt: now,
            visibility: input.selectedVisibilityType,
            visitorId: input.visitorId,
          });
        }

        await tx
          .insert(ultraChatbotAgentMessages)
          .values({
            attachments: getStoredAttachments(input.message),
            chatId: input.chatId,
            createdAt: readMessageCreatedAt(input.message, now),
            messageId: input.message.id,
            parts: input.message.parts,
            role: input.message.role,
          })
          .onConflictDoUpdate({
            set: {
              attachments: getStoredAttachments(input.message),
              parts: input.message.parts,
              role: input.message.role,
            },
            target: [
              ultraChatbotAgentMessages.chatId,
              ultraChatbotAgentMessages.messageId,
            ],
          });
      });
    },
    async saveFinishedMessages(input: {
      chatId: string;
      messages: UIMessage[];
      visitorId: string;
    }) {
      const { database, ultraChatbotAgentChats, ultraChatbotAgentMessages } =
        await loadUltraChatbotAgentChatDatabase();
      const now = new Date();

      await database.transaction(async (tx) => {
        const [chat] = await tx
          .select()
          .from(ultraChatbotAgentChats)
          .where(
            and(
              eq(ultraChatbotAgentChats.id, input.chatId),
              eq(ultraChatbotAgentChats.visitorId, input.visitorId)
            )
          )
          .limit(1);

        if (!chat) {
          throw new Error(getUltraChatbotAgentChatNotFoundError(input.chatId));
        }

        if (input.messages.length > 0) {
          await tx
            .insert(ultraChatbotAgentMessages)
            .values(
              input.messages.map((message) => ({
                attachments: getStoredAttachments(message),
                chatId: input.chatId,
                createdAt: readMessageCreatedAt(message, now),
                messageId: message.id,
                parts: message.parts,
                role: message.role,
              }))
            )
            .onConflictDoNothing({
              target: [
                ultraChatbotAgentMessages.chatId,
                ultraChatbotAgentMessages.messageId,
              ],
            });
        }

        await tx
          .update(ultraChatbotAgentChats)
          .set({
            activeStreamId: null,
            updatedAt: now,
          })
          .where(eq(ultraChatbotAgentChats.id, input.chatId));
      });
    },
    async setActiveStream(input: {
      activeStreamId: string | null;
      chatId: string;
      visitorId: string;
    }) {
      const { database, ultraChatbotAgentChats } =
        await loadUltraChatbotAgentChatDatabase();
      const rows = await database
        .update(ultraChatbotAgentChats)
        .set({
          activeStreamId: input.activeStreamId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(ultraChatbotAgentChats.id, input.chatId),
            eq(ultraChatbotAgentChats.visitorId, input.visitorId)
          )
        )
        .returning({ id: ultraChatbotAgentChats.id });

      if (rows.length === 0) {
        throw new Error(getUltraChatbotAgentChatNotFoundError(input.chatId));
      }
    },
    async setChatCapabilities(input: {
      capabilities: Partial<UltraChatbotAgentCapabilities>;
      chatId: string;
      visitorId: string;
    }) {
      const { database, ultraChatbotAgentChats } =
        await loadUltraChatbotAgentChatDatabase();
      const [existingChat] = await database
        .select({
          capabilities: ultraChatbotAgentChats.capabilities,
        })
        .from(ultraChatbotAgentChats)
        .where(
          and(
            eq(ultraChatbotAgentChats.id, input.chatId),
            eq(ultraChatbotAgentChats.visitorId, input.visitorId)
          )
        )
        .limit(1);

      if (!existingChat) {
        throw new Error(getUltraChatbotAgentChatNotFoundError(input.chatId));
      }

      const nextCapabilities = {
        ...normalizeUltraChatbotAgentCapabilities(existingChat.capabilities),
        ...input.capabilities,
      } satisfies UltraChatbotAgentCapabilities;

      const rows = await database
        .update(ultraChatbotAgentChats)
        .set({
          capabilities: nextCapabilities,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(ultraChatbotAgentChats.id, input.chatId),
            eq(ultraChatbotAgentChats.visitorId, input.visitorId)
          )
        )
        .returning({ capabilities: ultraChatbotAgentChats.capabilities });

      return normalizeUltraChatbotAgentCapabilities(rows[0]?.capabilities);
    },
    async saveVote(input: {
      chatId: string;
      isUpvoted: boolean;
      messageId: string;
      visitorId: string;
    }) {
      const { database, ultraChatbotAgentVotes } =
        await loadUltraChatbotAgentChatDatabase();

      await database
        .insert(ultraChatbotAgentVotes)
        .values({
          chatId: input.chatId,
          isUpvoted: input.isUpvoted,
          messageId: input.messageId,
          visitorId: input.visitorId,
        })
        .onConflictDoUpdate({
          set: {
            isUpvoted: input.isUpvoted,
          },
          target: [
            ultraChatbotAgentVotes.chatId,
            ultraChatbotAgentVotes.messageId,
            ultraChatbotAgentVotes.visitorId,
          ],
        });
    },
    async deleteVote(input: {
      chatId: string;
      messageId: string;
      visitorId: string;
    }) {
      const { database, ultraChatbotAgentVotes } =
        await loadUltraChatbotAgentChatDatabase();

      await database
        .delete(ultraChatbotAgentVotes)
        .where(
          and(
            eq(ultraChatbotAgentVotes.chatId, input.chatId),
            eq(ultraChatbotAgentVotes.messageId, input.messageId),
            eq(ultraChatbotAgentVotes.visitorId, input.visitorId)
          )
        );
    },
    async setChatVisibility(input: {
      chatId: string;
      visibility: "private" | "public";
      visitorId: string;
    }) {
      const { database, ultraChatbotAgentChats } =
        await loadUltraChatbotAgentChatDatabase();
      const rows = await database
        .update(ultraChatbotAgentChats)
        .set({
          updatedAt: new Date(),
          visibility: input.visibility,
        })
        .where(
          and(
            eq(ultraChatbotAgentChats.id, input.chatId),
            eq(ultraChatbotAgentChats.visitorId, input.visitorId)
          )
        )
        .returning({ visibility: ultraChatbotAgentChats.visibility });

      if (rows.length === 0) {
        throw new Error(getUltraChatbotAgentChatNotFoundError(input.chatId));
      }

      return rows[0];
    },
    async deleteMessagesAfterMessage(input: {
      chatId: string;
      messageId: string;
      visitorId: string;
    }) {
      const { database, ultraChatbotAgentChats, ultraChatbotAgentMessages } =
        await loadUltraChatbotAgentChatDatabase();

      const [targetMessage] = await database
        .select({
          createdAt: ultraChatbotAgentMessages.createdAt,
        })
        .from(ultraChatbotAgentMessages)
        .innerJoin(
          ultraChatbotAgentChats,
          eq(ultraChatbotAgentMessages.chatId, ultraChatbotAgentChats.id)
        )
        .where(
          and(
            eq(ultraChatbotAgentMessages.chatId, input.chatId),
            eq(ultraChatbotAgentMessages.messageId, input.messageId),
            eq(ultraChatbotAgentChats.visitorId, input.visitorId)
          )
        )
        .limit(1);

      if (!targetMessage) {
        throw new Error(getUltraChatbotAgentChatNotFoundError(input.chatId));
      }

      const deletedRows = await database
        .delete(ultraChatbotAgentMessages)
        .where(
          and(
            eq(ultraChatbotAgentMessages.chatId, input.chatId),
            gt(ultraChatbotAgentMessages.createdAt, targetMessage.createdAt)
          )
        )
        .returning({ messageId: ultraChatbotAgentMessages.messageId });

      await database
        .update(ultraChatbotAgentChats)
        .set({
          activeStreamId: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(ultraChatbotAgentChats.id, input.chatId),
            eq(ultraChatbotAgentChats.visitorId, input.visitorId)
          )
        );

      return {
        deletedCount: deletedRows.length,
      };
    },
    async deleteAllChatsForVisitor(input: { visitorId: string }) {
      const {
        database,
        ultraChatbotAgentChats,
        ultraChatbotAgentMessages,
        ultraChatbotAgentStreams,
        ultraChatbotAgentVotes,
      } = await loadUltraChatbotAgentDatabaseModule();
      const visitorChats = await database
        .select({ id: ultraChatbotAgentChats.id })
        .from(ultraChatbotAgentChats)
        .where(eq(ultraChatbotAgentChats.visitorId, input.visitorId));

      if (visitorChats.length === 0) {
        return {
          deletedCount: 0,
        };
      }

      const chatIds = visitorChats.map((chat) => chat.id);

      await database
        .delete(ultraChatbotAgentVotes)
        .where(inArray(ultraChatbotAgentVotes.chatId, chatIds));
      await database
        .delete(ultraChatbotAgentMessages)
        .where(inArray(ultraChatbotAgentMessages.chatId, chatIds));
      await database
        .delete(ultraChatbotAgentStreams)
        .where(inArray(ultraChatbotAgentStreams.chatId, chatIds));

      const deletedChats = await database
        .delete(ultraChatbotAgentChats)
        .where(eq(ultraChatbotAgentChats.visitorId, input.visitorId))
        .returning({ id: ultraChatbotAgentChats.id });

      return {
        deletedCount: deletedChats.length,
      };
    },
    async deleteChatForVisitor(input: { chatId: string; visitorId: string }) {
      try {
        const { database, ultraChatbotAgentChats, ultraChatbotAgentVotes } =
          await loadUltraChatbotAgentDatabaseModule();

        const deletedChats = await database.transaction(async (tx) => {
          const rows = await tx
            .delete(ultraChatbotAgentChats)
            .where(
              and(
                eq(ultraChatbotAgentChats.id, input.chatId),
                eq(ultraChatbotAgentChats.visitorId, input.visitorId)
              )
            )
            .returning({ id: ultraChatbotAgentChats.id });

          if (rows.length > 0) {
            await tx
              .delete(ultraChatbotAgentVotes)
              .where(eq(ultraChatbotAgentVotes.chatId, input.chatId));
          }

          return rows;
        });

        return {
          deletedCount: deletedChats.length,
        };
      } catch (error) {
        if (isInvalidUltraChatbotAgentChatIdError(error)) {
          return {
            deletedCount: 0,
          };
        }

        throw error;
      }
    },
    cleanupExpiredChats(input?: { now?: Date }) {
      return cleanupExpiredUltraChatbotAgentChats(input);
    },
  };
}
