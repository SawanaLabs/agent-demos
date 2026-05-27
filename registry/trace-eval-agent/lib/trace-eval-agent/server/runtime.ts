import { type UIMessage, validateUIMessages } from "ai";

import { streamTraceEvalAgent } from "./chat";
import {
  getTraceEvalAgentEnv,
  getTraceEvalAgentSetupState,
  type TraceEvalAgentEnv,
} from "./env";
import { resolveTraceEvalAgentChatModel } from "./model";

interface TraceEvalAgentRequestBody {
  messages?: UIMessage[];
}

interface TraceEvalAgentRequestDependencies {
  streamTraceEvalAgent: (
    messages: UIMessage[],
    env: TraceEvalAgentEnv
  ) => Promise<Response> | Response;
}

export interface TraceEvalAgentRuntimeState {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

const invalidMessagesError = 'Expected a JSON body with a "messages" array.';
const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';

async function readTraceEvalAgentMessages(body: unknown): Promise<UIMessage[]> {
  const { messages } = (body ?? {}) as TraceEvalAgentRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  try {
    return await validateUIMessages({ messages });
  } catch {
    throw new Error(invalidUiMessagesError);
  }
}

export function getTraceEvalAgentRuntimeState(
  env: TraceEvalAgentEnv = getTraceEvalAgentEnv()
): TraceEvalAgentRuntimeState {
  const setup = getTraceEvalAgentSetupState(env);

  return {
    chatModel: resolveTraceEvalAgentChatModel(env),
    isChatAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
  };
}

export async function handleTraceEvalAgentRequest(
  request: Request,
  env: TraceEvalAgentEnv = getTraceEvalAgentEnv(),
  dependencies: TraceEvalAgentRequestDependencies = {
    streamTraceEvalAgent,
  }
) {
  const runtimeState = getTraceEvalAgentRuntimeState(env);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  try {
    const messages = await readTraceEvalAgentMessages(await request.json());

    return dependencies.streamTraceEvalAgent(messages, env);
  } catch (error) {
    if (
      error instanceof Error &&
      [invalidMessagesError, invalidUiMessagesError].includes(error.message)
    ) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    throw error;
  }
}
