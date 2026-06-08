import { inArray, lt } from "@workspace/database/drizzle";
import type { UIMessage } from "ai";

import { demoDataRetentionDays } from "@/features/shared/demo-data-retention/server/policy";

import {
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
  database: typeof import("@workspace/database")["database"];
  ultraChatbotAgentChats: typeof import("@workspace/database")["ultraChatbotAgentChats"];
  ultraChatbotAgentMessages: typeof import("@workspace/database")["ultraChatbotAgentMessages"];
  ultraChatbotAgentVotes: typeof import("@workspace/database")["ultraChatbotAgentVotes"];
}

function toIsoString(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function subtractDays(date: Date, days: number) {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

export function normalizeChatRecord(record: {
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

export async function loadUltraChatbotAgentDatabase(): Promise<UltraChatbotAgentDatabaseModule> {
  const databaseModule = await import("@workspace/database");

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

export function buildChatTitle(message: UIMessage) {
  const text = getMessageText(message);

  if (text.length === 0) {
    return "New chat";
  }

  return text.slice(0, 72);
}

export function readMessageCreatedAt(message: UIMessage, fallback: Date) {
  const metadata = message.metadata as { createdAt?: string } | undefined;

  if (!metadata?.createdAt) {
    return fallback;
  }

  const createdAt = new Date(metadata.createdAt);

  return Number.isNaN(createdAt.valueOf()) ? fallback : createdAt;
}

export function toUiMessage(row: {
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

export function getStoredAttachments(message: UIMessage) {
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

export function isInvalidUltraChatbotAgentChatIdError(error: unknown) {
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
        await loadUltraChatbotAgentDatabase();

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
        await loadUltraChatbotAgentDatabase();
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
