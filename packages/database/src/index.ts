import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { databaseSchema } from "./database-schema";
import { keys } from "./keys";

const client = new Pool({
  connectionString: keys().DATABASE_URL,
});

export const database = drizzle({ client, schema: databaseSchema });

export type Database = typeof database;
export * from "./schemas/customer-memory-agent";
export * from "./schemas/persistent-agent";
export * from "./schemas/rag-chatbot";
export * from "./schemas/site-usage";
export * from "./schemas/ultra-chatbot-agent";
