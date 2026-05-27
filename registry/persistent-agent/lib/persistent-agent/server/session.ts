import { cookies } from "next/headers";

import {
  createPersistentAgentChatStore,
  type PersistentAgentChatRecord,
  type PersistentAgentChatSession,
} from "./chat-store";
import { persistentAgentVisitorCookieName } from "./viewer-context";

export interface PersistentAgentScreenData {
  draftChatId: string;
  initialSession: PersistentAgentChatSession | null;
  recentChats: PersistentAgentChatRecord[];
  visitorId: string | null;
}

export async function loadPersistentAgentScreenData(input: {
  chatId?: string | null;
}) {
  const draftChatId = crypto.randomUUID();
  const cookieStore = await cookies();
  const visitorId =
    cookieStore.get(persistentAgentVisitorCookieName)?.value ?? null;

  if (!visitorId) {
    return {
      draftChatId,
      initialSession: null,
      recentChats: [],
      visitorId: null,
    } satisfies PersistentAgentScreenData;
  }

  const store = createPersistentAgentChatStore();
  const [initialSession, recentChats] = await Promise.all([
    input.chatId
      ? store.loadChatSession(input.chatId, visitorId)
      : Promise.resolve(null),
    store.listChatsForVisitor(visitorId),
  ]);

  return {
    draftChatId,
    initialSession,
    recentChats,
    visitorId,
  } satisfies PersistentAgentScreenData;
}
