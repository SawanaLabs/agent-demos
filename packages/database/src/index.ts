import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { keys } from "./keys";
import * as schema from "./schema";

const client = neon(keys().DATABASE_URL);

export const database = drizzle({ client, schema });

export type Database = typeof database;
export * from "./schema";
