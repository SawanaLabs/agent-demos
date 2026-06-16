import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

interface TurboTaskConfig {
  env?: string[];
  passThroughEnv?: string[];
}

interface TurboConfig {
  extends?: string[];
  tasks?: {
    build?: TurboTaskConfig;
  };
}

const configPath = new URL("./turbo.json", import.meta.url);
const featureContractsDirectory = fileURLToPath(
  new URL("./features", import.meta.url)
);
const envAccessPattern = /process\.env\.([A-Z0-9_]+)/g;

function readWebTurboConfig(): TurboConfig {
  return JSON.parse(readFileSync(configPath, "utf8")) as TurboConfig;
}

function listKeyContractFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = `${directory}/${entry.name}`;

    if (entry.isDirectory()) {
      return listKeyContractFiles(path);
    }

    return entry.isFile() && entry.name === "keys.ts" ? [path] : [];
  });
}

function readContractEnvNames(): string[] {
  const names = new Set<string>();

  for (const file of listKeyContractFiles(featureContractsDirectory)) {
    const source = readFileSync(file, "utf8");

    for (const match of source.matchAll(envAccessPattern)) {
      const name = match[1];

      if (name) {
        names.add(name);
      }
    }
  }

  return [...names].sort();
}

function patternMatchesName(pattern: string, name: string): boolean {
  return pattern.endsWith("*")
    ? name.startsWith(pattern.slice(0, -1))
    : pattern === name;
}

function isClassifiedByTurbo(config: TurboConfig, name: string): boolean {
  const build = config.tasks?.build;
  const patterns = [...(build?.env ?? []), ...(build?.passThroughEnv ?? [])];

  return patterns.some((pattern) => patternMatchesName(pattern, name));
}

describe("web Turbo environment contract", () => {
  it("keeps build-output env vars in the web build hash", () => {
    const config = readWebTurboConfig();

    expect(config.extends).toEqual(["//"]);
    expect(config.tasks?.build?.env).toEqual(
      expect.arrayContaining([
        "AI_GATEWAY_*",
        "DATABASE_URL",
        "REDIS_URL",
        "BLOB_READ_WRITE_TOKEN",
        "LANGGRAPH_AGENT_*",
        "OPENAI_API_KEY",
      ])
    );
  });

  it("passes runtime-only secrets without making them build cache inputs", () => {
    const config = readWebTurboConfig();

    expect(config.tasks?.build?.passThroughEnv).toEqual(
      expect.arrayContaining([
        "CRON_SECRET",
        "VERCEL_ENV",
        "VERCEL_SANDBOX_INTEGRATION",
        "VERCEL_OIDC_TOKEN",
        "VERCEL_PROJECT_ID",
        "VERCEL_TARGET_ENV",
        "VERCEL_TEAM_ID",
        "VERCEL_TOKEN",
      ])
    );
  });

  it("classifies every web feature key contract env var", () => {
    const config = readWebTurboConfig();
    const unclassifiedNames = readContractEnvNames().filter(
      (name) => !isClassifiedByTurbo(config, name)
    );

    expect(unclassifiedNames).toEqual([]);
  });
});
