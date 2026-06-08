import { and, eq, gt, inArray } from "@workspace/database/drizzle";
import type { UIMessage } from "ai";

import {
  getUltraChatbotAgentDefaultCapabilities,
  normalizeUltraChatbotAgentCapabilities,
  type UltraChatbotAgentCapabilities,
} from "./capabilities";
import {
  buildChatTitle,
  getStoredAttachments,
  getUltraChatbotAgentChatNotFoundError,
  isInvalidUltraChatbotAgentChatIdError,
  loadUltraChatbotAgentDatabase,
  readMessageCreatedAt,
} from "./chat-store-internals";

export async function saveUltraChatbotAgentIncomingUserMessage(input: {
  chatId: string;
  message: UIMessage;
  selectedChatModel: string;
  selectedVisibilityType: "private" | "public";
  visitorId: string;
}) {
  const { database, ultraChatbotAgentChats, ultraChatbotAgentMessages } =
    await loadUltraChatbotAgentDatabase();
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
}

export async function saveUltraChatbotAgentFinishedMessages(input: {
  chatId: string;
  messages: UIMessage[];
  visitorId: string;
}) {
  const { database, ultraChatbotAgentChats, ultraChatbotAgentMessages } =
    await loadUltraChatbotAgentDatabase();
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
}

export async function setUltraChatbotAgentActiveStream(input: {
  activeStreamId: string | null;
  chatId: string;
  visitorId: string;
}) {
  const { database, ultraChatbotAgentChats } =
    await loadUltraChatbotAgentDatabase();
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
}

export async function setUltraChatbotAgentChatCapabilities(input: {
  capabilities: Partial<UltraChatbotAgentCapabilities>;
  chatId: string;
  visitorId: string;
}) {
  const { database, ultraChatbotAgentChats } =
    await loadUltraChatbotAgentDatabase();
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
}

export async function saveUltraChatbotAgentVote(input: {
  chatId: string;
  isUpvoted: boolean;
  messageId: string;
  visitorId: string;
}) {
  const { database, ultraChatbotAgentVotes } =
    await loadUltraChatbotAgentDatabase();

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
}

export async function deleteUltraChatbotAgentVote(input: {
  chatId: string;
  messageId: string;
  visitorId: string;
}) {
  const { database, ultraChatbotAgentVotes } =
    await loadUltraChatbotAgentDatabase();

  await database
    .delete(ultraChatbotAgentVotes)
    .where(
      and(
        eq(ultraChatbotAgentVotes.chatId, input.chatId),
        eq(ultraChatbotAgentVotes.messageId, input.messageId),
        eq(ultraChatbotAgentVotes.visitorId, input.visitorId)
      )
    );
}

export async function setUltraChatbotAgentChatVisibility(input: {
  chatId: string;
  visibility: "private" | "public";
  visitorId: string;
}) {
  const { database, ultraChatbotAgentChats } =
    await loadUltraChatbotAgentDatabase();
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
}

export async function deleteUltraChatbotAgentMessagesAfterMessage(input: {
  chatId: string;
  messageId: string;
  visitorId: string;
}) {
  const { database, ultraChatbotAgentChats, ultraChatbotAgentMessages } =
    await loadUltraChatbotAgentDatabase();
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
}

export async function deleteAllUltraChatbotAgentChatsForVisitor(input: {
  visitorId: string;
}) {
  const {
    database,
    ultraChatbotAgentChats,
    ultraChatbotAgentMessages,
    ultraChatbotAgentStreams,
    ultraChatbotAgentVotes,
  } = await import("@workspace/database");
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
}

export async function deleteUltraChatbotAgentChatForVisitor(input: {
  chatId: string;
  visitorId: string;
}) {
  try {
    const { database, ultraChatbotAgentChats, ultraChatbotAgentVotes } =
      await import("@workspace/database");

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
}
