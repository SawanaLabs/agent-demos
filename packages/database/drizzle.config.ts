import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

import { keys } from "./src/keys";

const configDirectory = dirname(fileURLToPath(import.meta.url));

// Vercel CLI pulls integration env vars to the workspace root, while Drizzle
// runs from this package. Keep package-local env files usable for overrides.
for (const path of [
  resolve(configDirectory, ".env.local"),
  resolve(configDirectory, "../../.env.local"),
  resolve(configDirectory, ".env"),
  resolve(configDirectory, "../../.env"),
]) {
  config({ path });
}

export default defineConfig({
  schema: "./src/schemas/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: keys().DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
