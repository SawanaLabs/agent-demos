import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { RunContext, RunItem } from "@openai/agents";
import {
  Capabilities,
  localDir,
  Manifest,
  SandboxAgent,
} from "@openai/agents/sandbox";
import {
  UnixLocalSandboxClient,
  type UnixLocalSandboxSessionState,
} from "@openai/agents/sandbox/local";
import { z } from "zod";

import type { OpenAiAgentsSdkDemoMessageMetadata } from "../message-metadata";
import type { OpenAiAgentsSdkDemoContext } from "./context";
import type { OpenAiAgentsSdkDemoModelProfile } from "./models";

const sandboxManifestRoot = "/workspace";
const sandboxAgentModel = "openai/gpt-5.4-mini";

function firstExistingPath(paths: readonly string[], label: string) {
  const resolvedPath = paths.find((path) => existsSync(path));

  if (!resolvedPath) {
    throw new Error(
      `Could not resolve the OpenAI Agents SDK demo sandbox ${label} path from cwd ${process.cwd()}.`
    );
  }

  return resolvedPath;
}

const sandboxMountedEntries = {
  docs: firstExistingPath(
    [
      resolve(process.cwd(), "docs/frontend"),
      resolve(process.cwd(), "src/docs/frontend"),
      resolve(process.cwd(), "lib/openai-agents-sdk-demo"),
      resolve(process.cwd(), "src/lib/openai-agents-sdk-demo"),
    ],
    "docs"
  ),
  feature: firstExistingPath(
    [
      resolve(process.cwd(), "lib/openai-agents-sdk-demo"),
      resolve(process.cwd(), "src/lib/openai-agents-sdk-demo"),
    ],
    "feature"
  ),
} as const;
const sandboxClient = new UnixLocalSandboxClient();
const sandboxSessionStateStore = new Map<
  string,
  UnixLocalSandboxSessionState
>();

export const openAiAgentsSdkDemoSandboxSummarySchema = z.object({
  backendId: z.string(),
  currentAgentName: z.string(),
  manifestRoot: z.string(),
  mountedPaths: z.array(z.string()),
  persistedSessionCount: z.number().int().nonnegative(),
  sessionId: z.string(),
  workspaceReady: z.boolean(),
});

export interface OpenAiAgentsSdkDemoSandboxProfile {
  agentModel: "openai/gpt-5.4-mini";
  clientBackend: "unix_local";
  defaultCapabilities: ["filesystem()", "shell()", "compaction()"];
  manifestRoot: "/workspace";
  mountedPaths: ["/workspace/docs", "/workspace/feature"];
  sdkPrimitives: [
    "SandboxAgent",
    "Manifest",
    "Capabilities.default()",
    "UnixLocalSandboxClient",
    "RunConfig.sandbox",
  ];
  sessionPersistence: "session-id -> process-local sessionState";
  workspaceSource: "localDir() -> temp workspace";
}

function getSandboxMountedPaths() {
  return ["/workspace/docs", "/workspace/feature"] as const;
}

function didUseOpenAiAgentsSdkDemoSandboxTool(newItems: RunItem[] = []) {
  return newItems.some(
    (item) =>
      (item.rawItem as { name?: string } | undefined)?.name ===
      "sandbox_workspace_agent"
  );
}

function createOpenAiAgentsSdkDemoSandboxManifest() {
  return new Manifest({
    extraPathGrants: Object.values(sandboxMountedEntries).map((path) => ({
      description: "OpenAI Agents SDK demo sandbox source path",
      path,
      readOnly: true,
    })),
    entries: {
      docs: localDir({
        src: sandboxMountedEntries.docs,
      }),
      feature: localDir({
        src: sandboxMountedEntries.feature,
      }),
    },
    root: sandboxManifestRoot,
  });
}

export function getOpenAiAgentsSdkDemoSandboxProfile(): OpenAiAgentsSdkDemoSandboxProfile {
  return {
    agentModel: "openai/gpt-5.4-mini",
    clientBackend: "unix_local",
    defaultCapabilities: ["filesystem()", "shell()", "compaction()"],
    manifestRoot: "/workspace",
    mountedPaths: ["/workspace/docs", "/workspace/feature"],
    sdkPrimitives: [
      "SandboxAgent",
      "Manifest",
      "Capabilities.default()",
      "UnixLocalSandboxClient",
      "RunConfig.sandbox",
    ],
    sessionPersistence: "session-id -> process-local sessionState",
    workspaceSource: "localDir() -> temp workspace",
  };
}

function getSerializedSandboxState(state?: { toJSON?: () => unknown }) {
  const serializedState = state?.toJSON?.() as
    | {
        sandbox?: {
          backendId: string;
          currentAgentName: string;
          sessionState: {
            manifest?: {
              entries?: Record<string, unknown>;
              root?: string;
            };
            workspaceReady: boolean;
          };
          sessionsByAgent: Record<string, unknown>;
        };
      }
    | undefined;

  return serializedState?.sandbox;
}

export function createOpenAiAgentsSdkDemoSandboxWorkspaceAgent({
  modelProfile,
}: {
  modelProfile: OpenAiAgentsSdkDemoModelProfile;
}) {
  return new SandboxAgent<OpenAiAgentsSdkDemoContext>({
    capabilities: [...Capabilities.default()],
    defaultManifest: createOpenAiAgentsSdkDemoSandboxManifest(),
    instructions: (runContext: RunContext<OpenAiAgentsSdkDemoContext>) =>
      [
        "Use the sandbox workspace to inspect the mounted demo docs and feature slice when the user needs repo-grounded answers.",
        `Current demo run mode: ${runContext.context.researchMode}.`,
        "Mounted workspace paths: /workspace/docs and /workspace/feature.",
        "Prefer rg and sed for inspection, and cite the exact sandbox paths you read.",
        "Do not claim changes to the host repository. Any edits stay inside the sandbox workspace unless the user explicitly asks for a patch plan.",
      ].join(" "),
    model: sandboxAgentModel,
    modelSettings: {
      reasoning: {
        effort: modelProfile.reasoningEffort,
      },
      text: {
        verbosity: modelProfile.textVerbosity,
      },
    },
    name: "Sandbox Workspace Agent",
  });
}

export function getOpenAiAgentsSdkDemoSandboxRunConfig({
  sessionId,
}: {
  sessionId: string;
}) {
  const sessionState = sandboxSessionStateStore.get(sessionId);

  return {
    sandbox: {
      client: sandboxClient,
      ...(sessionState ? { sessionState } : {}),
    },
  };
}

export function recordOpenAiAgentsSdkDemoSandboxSessionState({
  sessionId,
  state,
}: {
  sessionId: string;
  state?: {
    toJSON?: () => unknown;
  };
}) {
  const serializedState = state?.toJSON?.() as
    | {
        sandbox?: {
          sessionState?: UnixLocalSandboxSessionState;
        };
      }
    | undefined;
  const sessionState = serializedState?.sandbox?.sessionState;

  if (!sessionState) {
    return;
  }

  sandboxSessionStateStore.set(sessionId, sessionState);
}

export function getOpenAiAgentsSdkDemoSandboxUsageMetadata({
  newItems = [],
  sessionId,
  state,
}: {
  newItems?: RunItem[];
  sessionId: string;
  state?: {
    toJSON?: () => unknown;
  };
}) {
  const sandboxState = getSerializedSandboxState(state);
  const usedSandboxTool = didUseOpenAiAgentsSdkDemoSandboxTool(newItems);

  if (!(sandboxState || usedSandboxTool)) {
    return;
  }

  const mountedPaths = Object.keys(
    sandboxState?.sessionState.manifest?.entries ?? {}
  ).map((entryName) => `${sandboxManifestRoot}/${entryName}`);

  return {
    sandboxSummary: {
      backendId: sandboxState?.backendId ?? "unix_local",
      currentAgentName:
        sandboxState?.currentAgentName ?? "Sandbox Workspace Agent",
      manifestRoot:
        sandboxState?.sessionState.manifest?.root ?? sandboxManifestRoot,
      mountedPaths:
        mountedPaths.length > 0 ? mountedPaths : [...getSandboxMountedPaths()],
      persistedSessionCount: sandboxState
        ? Object.keys(sandboxState.sessionsByAgent).length
        : sandboxSessionStateStore.has(sessionId)
          ? 1
          : 0,
      sessionId,
      workspaceReady:
        sandboxState?.sessionState.workspaceReady ?? usedSandboxTool,
    },
    usedGuideIds: ["sandbox-agents"],
  } satisfies OpenAiAgentsSdkDemoMessageMetadata;
}

export function clearOpenAiAgentsSdkDemoSandboxSessionStateStore() {
  sandboxSessionStateStore.clear();
}
