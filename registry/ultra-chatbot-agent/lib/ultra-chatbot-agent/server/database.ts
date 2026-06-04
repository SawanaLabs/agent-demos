import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import {
  getUltraChatbotAgentDatabaseConfig,
  getUltraChatbotAgentAppEnv,
  type UltraChatbotAgentEnv,
} from "./env";
import {
  ultraChatbotAgentChats,
  ultraChatbotAgentDocuments,
  ultraChatbotAgentMessages,
  ultraChatbotAgentSchema,
  ultraChatbotAgentStreams,
  ultraChatbotAgentSuggestions,
  ultraChatbotAgentVotes,
} from "./schema";

function createUltraChatbotAgentDatabase(connectionString: string) {
  const client = new Pool({ connectionString });
  const database = drizzle({
    client,
    schema: ultraChatbotAgentSchema,
  });

  return { client, database };
}

export type UltraChatbotAgentDatabase = ReturnType<
  typeof createUltraChatbotAgentDatabase
>["database"];

let databaseModulePromise:
  | Promise<{
      database: UltraChatbotAgentDatabase;
      ultraChatbotAgentChats: typeof ultraChatbotAgentChats;
      ultraChatbotAgentDocuments: typeof ultraChatbotAgentDocuments;
      ultraChatbotAgentMessages: typeof ultraChatbotAgentMessages;
      ultraChatbotAgentStreams: typeof ultraChatbotAgentStreams;
      ultraChatbotAgentSuggestions: typeof ultraChatbotAgentSuggestions;
      ultraChatbotAgentVotes: typeof ultraChatbotAgentVotes;
    }>
  | null = null;

export async function loadUltraChatbotAgentDatabase(
  env: UltraChatbotAgentEnv = getUltraChatbotAgentAppEnv()
) {
  if (!databaseModulePromise) {
    const { databaseUrl } = getUltraChatbotAgentDatabaseConfig(env);
    const { database } = createUltraChatbotAgentDatabase(databaseUrl);

    databaseModulePromise = Promise.resolve({
      database,
      ultraChatbotAgentChats,
      ultraChatbotAgentDocuments,
      ultraChatbotAgentMessages,
      ultraChatbotAgentStreams,
      ultraChatbotAgentSuggestions,
      ultraChatbotAgentVotes,
    });
  }

  return databaseModulePromise;
}

export {
  ultraChatbotAgentChats,
  ultraChatbotAgentDocuments,
  ultraChatbotAgentMessages,
  ultraChatbotAgentStreams,
  ultraChatbotAgentSuggestions,
  ultraChatbotAgentVotes,
};

export const database = new Proxy({} as UltraChatbotAgentDatabase, {
  get() {
    throw new Error(
      "Use loadUltraChatbotAgentDatabase() so DATABASE_URL is resolved lazily in registry installs."
    );
  },
});
