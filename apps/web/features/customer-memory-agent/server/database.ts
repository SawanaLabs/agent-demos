import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import {
  getCustomerMemoryAgentDatabaseConfig,
  getCustomerMemoryAgentEnv,
  type CustomerMemoryAgentEnv,
} from "./env";
import {
  customerMemoryAgentSchema,
  customerMemoryCompactions,
  customerMemoryEmbeddings,
  customerMemoryEvents,
  customerMemoryMemories,
  customerMemoryMessages,
  customerMemoryThreads,
} from "./schema";

function createCustomerMemoryAgentDatabase(connectionString: string) {
  const client = new Pool({ connectionString });
  const database = drizzle({
    client,
    schema: customerMemoryAgentSchema,
  });

  return { client, database };
}

type CustomerMemoryAgentDatabase = ReturnType<
  typeof createCustomerMemoryAgentDatabase
>["database"];

export interface CustomerMemoryAgentDatabaseModule {
  customerMemoryCompactions: typeof customerMemoryCompactions;
  customerMemoryEmbeddings: typeof customerMemoryEmbeddings;
  customerMemoryEvents: typeof customerMemoryEvents;
  customerMemoryMemories: typeof customerMemoryMemories;
  customerMemoryMessages: typeof customerMemoryMessages;
  customerMemoryThreads: typeof customerMemoryThreads;
  database: CustomerMemoryAgentDatabase;
}

let databaseModulePromise: Promise<CustomerMemoryAgentDatabaseModule> | null =
  null;

export async function loadCustomerMemoryAgentDatabase(
  env: CustomerMemoryAgentEnv = getCustomerMemoryAgentEnv()
): Promise<CustomerMemoryAgentDatabaseModule> {
  if (!databaseModulePromise) {
    const { databaseUrl } = getCustomerMemoryAgentDatabaseConfig(env);
    const { database } = createCustomerMemoryAgentDatabase(databaseUrl);

    databaseModulePromise = Promise.resolve({
      customerMemoryCompactions,
      customerMemoryEmbeddings,
      customerMemoryEvents,
      customerMemoryMemories,
      customerMemoryMessages,
      customerMemoryThreads,
      database,
    });
  }

  return databaseModulePromise;
}
