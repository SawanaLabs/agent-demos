import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import {
  getPersistentAgentDatabaseConfig,
  getPersistentAgentEnv,
  type PersistentAgentEnv,
} from "./env";
import {
  persistentAgentChats,
  persistentAgentMessages,
  persistentAgentSchema,
} from "./schema";

function createPersistentAgentDatabase(connectionString: string) {
  const client = new Pool({ connectionString });
  const database = drizzle({
    client,
    schema: persistentAgentSchema,
  });

  return { client, database };
}

type PersistentAgentDatabase = ReturnType<
  typeof createPersistentAgentDatabase
>["database"];

export interface PersistentAgentDatabaseModule {
  database: PersistentAgentDatabase;
  persistentAgentChats: typeof persistentAgentChats;
  persistentAgentMessages: typeof persistentAgentMessages;
}

let databaseModulePromise: Promise<PersistentAgentDatabaseModule> | null = null;

export async function loadPersistentAgentDatabase(
  env: PersistentAgentEnv = getPersistentAgentEnv()
): Promise<PersistentAgentDatabaseModule> {
  if (!databaseModulePromise) {
    const { databaseUrl } = getPersistentAgentDatabaseConfig(env);
    const { database } = createPersistentAgentDatabase(databaseUrl);

    databaseModulePromise = Promise.resolve({
      database,
      persistentAgentChats,
      persistentAgentMessages,
    });
  }

  return databaseModulePromise;
}
