import { randomUUID } from "node:crypto";
import {
  assertVercelSandboxIntegrationReady,
  type VercelSandboxEnv,
} from "./env";
import type { VercelSandboxCreateOptions } from "./session";

const sandboxNameUnsafeCharacterPattern = /[^a-z0-9-]/g;
const duplicateHyphenPattern = /-+/g;
const edgeHyphenPattern = /^-|-$/g;

function slugifySandboxNamePart(value: string) {
  const slug = value
    .toLowerCase()
    .replace(sandboxNameUnsafeCharacterPattern, "-")
    .replace(duplicateHyphenPattern, "-")
    .replace(edgeHyphenPattern, "");

  return slug || "sandbox";
}

export function createVercelSandboxIntegrationSessionId(label: string) {
  const labelSlug = slugifySandboxNamePart(label).slice(0, 48);
  const uniqueSuffix = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;

  return `it-${labelSlug}-${uniqueSuffix}`;
}

export function createVercelSandboxIntegrationOptions(
  tags: Record<string, string> = {}
): VercelSandboxCreateOptions {
  return {
    persistent: false,
    resources: { vcpus: 1 },
    tags: {
      suite: "integration",
      ...tags,
    },
    timeout: 300_000,
  };
}

export function assertVercelSandboxIntegrationTestReady(env: VercelSandboxEnv) {
  return assertVercelSandboxIntegrationReady(env);
}
