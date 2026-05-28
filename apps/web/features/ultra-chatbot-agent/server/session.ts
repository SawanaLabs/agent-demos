import { cookies } from "next/headers";

import {
  createUltraChatbotAgentChatStore,
  type UltraChatbotAgentChatSession,
  type UltraChatbotAgentHistoryPage,
} from "./chat-store";
import { ultraChatbotAgentVisitorCookieName } from "./viewer-context";

export interface UltraChatbotAgentScreenData {
  draftChatId: string;
  initialHistoryPage: UltraChatbotAgentHistoryPage;
  initialSession: UltraChatbotAgentChatSession | null;
  visitorId: string | null;
}

export async function loadUltraChatbotAgentScreenData(input: {
  chatId?: string | null;
}) {
  const draftChatId = crypto.randomUUID();
  const cookieStore = await cookies();
  const visitorId =
    cookieStore.get(ultraChatbotAgentVisitorCookieName)?.value ?? null;

  if (!visitorId) {
    return {
      draftChatId,
      initialHistoryPage: {
        chats: [],
        hasMore: false,
      },
      initialSession: null,
      visitorId: null,
    } satisfies UltraChatbotAgentScreenData;
  }

  const store = createUltraChatbotAgentChatStore();
  const [initialSession, initialHistoryPage] = await Promise.all([
    input.chatId
      ? store.loadChatSession(input.chatId, visitorId)
      : Promise.resolve(null),
    store.listChatsForVisitorPage({
      endingBefore: null,
      limit: 10,
      startingAfter: null,
      visitorId,
    }),
  ]);

  return {
    draftChatId,
    initialHistoryPage,
    initialSession,
    visitorId,
  } satisfies UltraChatbotAgentScreenData;
}
