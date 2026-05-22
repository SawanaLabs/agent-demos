import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { keys } from "./keys";
import * as schema from "./schema";

const client = new Pool({
  connectionString: keys().DATABASE_URL,
});

export const database = drizzle({ client, schema });

export type Database = typeof database;
export * from "./schema";
