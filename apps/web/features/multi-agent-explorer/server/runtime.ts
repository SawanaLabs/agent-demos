import { validateUIMessages } from "ai";

import type { MultiAgentExplorerUIMessage } from "../types";
import {
  getMultiAgentExplorerEnv,
  getMultiAgentExplorerSetupState,
  type MultiAgentExplorerEnv,
} from "./env";

interface MultiAgentExplorerRequestBody {
  messages?: MultiAgentExplorerUIMessage[];
}

export interface MultiAgentExplorerRuntimeState {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

interface MultiAgentExplorerRequestDependencies {
  streamMultiAgentExplorer: (
    messages: MultiAgentExplorerUIMessage[],
    env: MultiAgentExplorerEnv,
    abortSignal: AbortSignal
  ) => Promise<Response>;
}

const invalidMessagesError = 'Expected a JSON body with a "messages" array.';
const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';
const malformedJsonError = "Expected a valid JSON request body.";

export function getMultiAgentExplorerRuntimeState(
  env: MultiAgentExplorerEnv = getMultiAgentExplorerEnv()
): MultiAgentExplorerRuntimeState {
  const setup = getMultiAgentExplorerSetupState(env);

  return {
    chatModel: setup.config.chatModel,
    isChatAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
  };
}

async function readMultiAgentExplorerMessages(body: unknown) {
  const { messages } = (body ?? {}) as MultiAgentExplorerRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  try {
    return await validateUIMessages<MultiAgentExplorerUIMessage>({
      messages,
    });
  } catch {
    throw new Error(invalidUiMessagesError);
  }
}

async function streamMultiAgentExplorerFromRuntime(
  messages: MultiAgentExplorerUIMessage[],
  env: MultiAgentExplorerEnv,
  abortSignal: AbortSignal
) {
  const { streamMultiAgentExplorer } = await import("./chat");

  return streamMultiAgentExplorer(messages, env, abortSignal);
}

export async function handleMultiAgentExplorerRequest(
  request: Request,
  env: MultiAgentExplorerEnv = getMultiAgentExplorerEnv(),
  dependencies: MultiAgentExplorerRequestDependencies = {
    streamMultiAgentExplorer: streamMultiAgentExplorerFromRuntime,
  }
) {
  const runtimeState = getMultiAgentExplorerRuntimeState(env);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  let messages: MultiAgentExplorerUIMessage[];

  try {
    messages = await readMultiAgentExplorerMessages(await request.json());
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: malformedJsonError }, { status: 400 });
    }

    if (
      error instanceof Error &&
      [invalidMessagesError, invalidUiMessagesError].includes(error.message)
    ) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }

  return dependencies.streamMultiAgentExplorer(messages, env, request.signal);
}
