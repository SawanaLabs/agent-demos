import { type UIMessage, validateUIMessages } from "ai";

import {
  getMinimalChatAgentEnv,
  getMinimalChatAgentSetupState,
  type MinimalChatAgentEnv,
} from "./env";

interface MinimalChatAgentRequestBody {
  messages?: UIMessage[];
}

export interface MinimalChatAgentRuntimeState {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

interface MinimalChatAgentRequestDependencies {
  streamMinimalChatAgent: (
    messages: UIMessage[],
    env: MinimalChatAgentEnv,
    abortSignal: AbortSignal
  ) => Promise<Response>;
}

const invalidMessagesError = 'Expected a JSON body with a "messages" array.';
const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';
const malformedJsonError = "Expected a valid JSON request body.";

export function getMinimalChatAgentRuntimeState(
  env: MinimalChatAgentEnv = getMinimalChatAgentEnv()
): MinimalChatAgentRuntimeState {
  const setup = getMinimalChatAgentSetupState(env);

  return {
    chatModel: setup.config.chatModel,
    isChatAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
  };
}

async function readMinimalChatAgentMessages(body: unknown) {
  const { messages } = (body ?? {}) as MinimalChatAgentRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  try {
    return await validateUIMessages({ messages });
  } catch {
    throw new Error(invalidUiMessagesError);
  }
}

async function streamMinimalChatAgentFromRuntime(
  messages: UIMessage[],
  env: MinimalChatAgentEnv,
  abortSignal: AbortSignal
) {
  const { streamMinimalChatAgent } = await import("./chat");

  return streamMinimalChatAgent(messages, env, abortSignal);
}

export async function handleMinimalChatAgentRequest(
  request: Request,
  env: MinimalChatAgentEnv = getMinimalChatAgentEnv(),
  dependencies: MinimalChatAgentRequestDependencies = {
    streamMinimalChatAgent: streamMinimalChatAgentFromRuntime,
  }
) {
  const runtimeState = getMinimalChatAgentRuntimeState(env);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  let messages: UIMessage[];

  try {
    messages = await readMinimalChatAgentMessages(await request.json());
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

  return dependencies.streamMinimalChatAgent(messages, env, request.signal);
}
