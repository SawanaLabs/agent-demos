import { and, asc, desc, eq, gt, lt } from "@workspace/database/drizzle";

import {
  isInvalidUltraChatbotAgentChatIdError,
  loadUltraChatbotAgentDatabase,
  normalizeChatRecord,
  toUiMessage,
  type UltraChatbotAgentChatSession,
  type UltraChatbotAgentHistoryPage,
  type UltraChatbotAgentVoteRecord,
} from "./chat-store-internals";

export async function listUltraChatbotAgentChatsForVisitor(visitorId: string) {
  const { database, ultraChatbotAgentChats } =
    await loadUltraChatbotAgentDatabase();
  const rows = await database
    .select()
    .from(ultraChatbotAgentChats)
    .where(eq(ultraChatbotAgentChats.visitorId, visitorId))
    .orderBy(desc(ultraChatbotAgentChats.updatedAt));

  return rows.map(normalizeChatRecord);
}

export async function loadUltraChatbotAgentChatSession(
  chatId: string,
  visitorId: string
): Promise<UltraChatbotAgentChatSession | null> {
  try {
    const { database, ultraChatbotAgentChats, ultraChatbotAgentMessages } =
      await loadUltraChatbotAgentDatabase();
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
}

export async function listUltraChatbotAgentVotesForChat(input: {
  chatId: string;
  visitorId: string;
}): Promise<UltraChatbotAgentVoteRecord[]> {
  const { database, ultraChatbotAgentVotes } =
    await loadUltraChatbotAgentDatabase();
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
}

export async function listUltraChatbotAgentChatsForVisitorPage(input: {
  endingBefore: string | null;
  limit: number;
  startingAfter: string | null;
  visitorId: string;
}): Promise<UltraChatbotAgentHistoryPage> {
  const { database, ultraChatbotAgentChats } =
    await loadUltraChatbotAgentDatabase();
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
}
