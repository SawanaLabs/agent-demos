import { type UIMessage, validateUIMessages } from "ai";
import { type EveAgentEnv, getEveAgentEnv, getEveAgentSetupState } from "./env";
import {
  EvePackageUnavailableError,
  type EveSupport,
  resolveEveSupport,
} from "./eve";
import { EveSurfaceError } from "./eve-agent";

interface EveAgentRequestBody {
  messages?: UIMessage[];
}

export interface EveAgentRuntimeState {
  chatModel: string;
  eveStatus: EveSupport["status"];
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

interface EveAgentRequestDependencies {
  resolveEveSupport?: () => Promise<EveSupport>;
  streamEveAgent?: (
    messages: UIMessage[],
    env: EveAgentEnv,
    abortSignal: AbortSignal
  ) => Promise<Response>;
}

const invalidMessagesError = 'Expected a JSON body with a "messages" array.';
const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';
const malformedJsonError = "Expected a valid JSON request body.";

export async function getEveAgentRuntimeState(
  env: EveAgentEnv = getEveAgentEnv(),
  resolveSupport: () => Promise<EveSupport> = resolveEveSupport
): Promise<EveAgentRuntimeState> {
  const setup = await getEveAgentSetupState(env, resolveSupport);

  return {
    chatModel: setup.config.chatModel,
    eveStatus: setup.eveStatus,
    isChatAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
  };
}

async function readEveAgentMessages(body: unknown) {
  const { messages } = (body ?? {}) as EveAgentRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  try {
    return await validateUIMessages({ messages });
  } catch {
    throw new Error(invalidUiMessagesError);
  }
}

async function streamEveAgentFromRuntime(
  messages: UIMessage[],
  env: EveAgentEnv,
  abortSignal: AbortSignal
) {
  const { streamEveAgent } = await import("./chat");

  return streamEveAgent(messages, env, abortSignal);
}

export async function handleEveAgentRequest(
  request: Request,
  env: EveAgentEnv = getEveAgentEnv(),
  dependencies: EveAgentRequestDependencies = {}
) {
  const runtimeState = await getEveAgentRuntimeState(
    env,
    dependencies.resolveEveSupport
  );

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
    messages = await readEveAgentMessages(await request.json());
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

  const streamEveAgent =
    dependencies.streamEveAgent ?? streamEveAgentFromRuntime;

  try {
    return await streamEveAgent(messages, env, request.signal);
  } catch (error) {
    if (
      error instanceof EvePackageUnavailableError ||
      error instanceof EveSurfaceError
    ) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    throw error;
  }
}
