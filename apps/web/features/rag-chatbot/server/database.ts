import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import {
  getRagChatbotDatabaseConfig,
  getRagChatbotEnv,
  type RagChatbotEnv,
} from "./env";
import {
  ragChatbotEmbeddings,
  ragChatbotResources,
  ragChatbotSchema,
} from "./schema";

function createRagChatbotDatabase(connectionString: string) {
  const client = new Pool({ connectionString });
  const database = drizzle({
    client,
    schema: ragChatbotSchema,
  });

  return { client, database };
}

type RagChatbotDatabase = ReturnType<
  typeof createRagChatbotDatabase
>["database"];

export interface RagChatbotDatabaseModule {
  database: RagChatbotDatabase;
  ragChatbotEmbeddings: typeof ragChatbotEmbeddings;
  ragChatbotResources: typeof ragChatbotResources;
}

let databaseModulePromise: Promise<RagChatbotDatabaseModule> | null = null;

export async function loadRagChatbotDatabase(
  env: RagChatbotEnv = getRagChatbotEnv()
): Promise<RagChatbotDatabaseModule> {
  if (!databaseModulePromise) {
    const { databaseUrl } = getRagChatbotDatabaseConfig(env);
    const { database } = createRagChatbotDatabase(databaseUrl);

    databaseModulePromise = Promise.resolve({
      database,
      ragChatbotEmbeddings,
      ragChatbotResources,
    });
  }

  return databaseModulePromise;
}
