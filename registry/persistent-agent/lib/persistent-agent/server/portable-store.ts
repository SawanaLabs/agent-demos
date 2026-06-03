import type { UIMessage } from "ai";

import {
  getPersistentAgentChatNotFoundError,
  persistentAgentCleanupRetentionDays,
  type PersistentAgentChatPersistence,
  type PersistentAgentChatRecord,
  type PersistentAgentChatSession,
} from "./chat-store";

interface PortablePersistentAgentState {
  chats: Map<string, PersistentAgentChatRecord>;
  messagesByChatId: Map<string, UIMessage[]>;
}

const globalStore = globalThis as typeof globalThis & {
  __persistentAgentPortableStore?: PortablePersistentAgentState;
};

function getPortableState(): PortablePersistentAgentState {
  globalStore.__persistentAgentPortableStore ??= {
    chats: new Map(),
    messagesByChatId: new Map(),
  };

  return globalStore.__persistentAgentPortableStore;
}

function nowIsoString() {
  return new Date().toISOString();
}

function cloneRecord<T>(value: T): T {
  return structuredClone(value);
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

function normalizeMessageCreatedAt(message: UIMessage, fallback: string) {
  const metadata = message.metadata as { createdAt?: string } | undefined;

  if (!metadata?.createdAt) {
    return {
      ...message,
      metadata: {
        ...((message.metadata as Record<string, unknown> | undefined) ?? {}),
        createdAt: fallback,
      },
    };
  }

  const createdAt = new Date(metadata.createdAt);

  return {
    ...message,
    metadata: {
      ...((message.metadata as Record<string, unknown> | undefined) ?? {}),
      createdAt: Number.isNaN(createdAt.valueOf())
        ? fallback
        : createdAt.toISOString(),
    },
  };
}

function upsertMessage(messages: UIMessage[], nextMessage: UIMessage) {
  const existingIndex = messages.findIndex(
    (message) => message.id === nextMessage.id
  );

  if (existingIndex === -1) {
    return [...messages, nextMessage];
  }

  return messages.map((message, index) =>
    index === existingIndex ? nextMessage : message
  );
}

function assertChatForVisitor(
  chat: PersistentAgentChatRecord | undefined,
  chatId: string,
  visitorId: string
) {
  if (!chat || chat.visitorId !== visitorId) {
    throw new Error(getPersistentAgentChatNotFoundError(chatId));
  }

  return chat;
}

export function createPortablePersistentAgentChatPersistence(): PersistentAgentChatPersistence {
  const state = getPortableState();

  return {
    async listChatsForVisitor(visitorId) {
      return [...state.chats.values()]
        .filter((chat) => chat.visitorId === visitorId)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .map(cloneRecord);
    },
    async loadChatSession(chatId, visitorId): Promise<PersistentAgentChatSession | null> {
      const chat = state.chats.get(chatId);

      if (!chat || chat.visitorId !== visitorId) {
        return null;
      }

      return {
        chat: cloneRecord(chat),
        messages: cloneRecord(state.messagesByChatId.get(chatId) ?? []),
      };
    },
    async saveIncomingUserMessage(input) {
      const timestamp = nowIsoString();
      const existingChat = state.chats.get(input.chatId);
      const title = buildChatTitle(input.message);

      if (existingChat && existingChat.visitorId !== input.visitorId) {
        throw new Error(getPersistentAgentChatNotFoundError(input.chatId));
      }

      const chat: PersistentAgentChatRecord = existingChat
        ? {
            ...existingChat,
            activeStreamId: null,
            title:
              existingChat.title === "New chat" && title !== "New chat"
                ? title
                : existingChat.title,
            updatedAt: timestamp,
          }
        : {
            activeStreamId: null,
            createdAt: timestamp,
            id: input.chatId,
            title,
            updatedAt: timestamp,
            visitorId: input.visitorId,
          };

      state.chats.set(input.chatId, chat);
      state.messagesByChatId.set(
        input.chatId,
        upsertMessage(
          state.messagesByChatId.get(input.chatId) ?? [],
          normalizeMessageCreatedAt(input.message, timestamp)
        )
      );
    },
    async saveFinishedMessages(input) {
      const timestamp = nowIsoString();
      const chat = assertChatForVisitor(
        state.chats.get(input.chatId),
        input.chatId,
        input.visitorId
      );
      const messages = input.messages.reduce(
        (currentMessages, message) =>
          upsertMessage(
            currentMessages,
            normalizeMessageCreatedAt(message, timestamp)
          ),
        state.messagesByChatId.get(input.chatId) ?? []
      );

      state.messagesByChatId.set(input.chatId, messages);
      state.chats.set(input.chatId, {
        ...chat,
        activeStreamId: null,
        updatedAt: timestamp,
      });
    },
    async setActiveStream(input) {
      const chat = assertChatForVisitor(
        state.chats.get(input.chatId),
        input.chatId,
        input.visitorId
      );

      state.chats.set(input.chatId, {
        ...chat,
        activeStreamId: input.activeStreamId,
        updatedAt: nowIsoString(),
      });
    },
    async cleanupExpiredChats(input) {
      const now = input?.now ?? new Date();
      const expiresBefore = new Date(
        now.getTime() -
          persistentAgentCleanupRetentionDays * 24 * 60 * 60 * 1000
      );
      let deletedChats = 0;

      for (const chat of state.chats.values()) {
        if (new Date(chat.updatedAt) >= expiresBefore) {
          continue;
        }

        state.chats.delete(chat.id);
        state.messagesByChatId.delete(chat.id);
        deletedChats += 1;
      }

      return {
        deletedChats,
        expiresBefore: expiresBefore.toISOString(),
      };
    },
  };
}
