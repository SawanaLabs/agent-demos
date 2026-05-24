import { type UIMessage, validateUIMessages } from "ai";
import { env as appEnv } from "@/env";

import { getAiGatewaySetupState } from "@/features/shared/ai-gateway/server/env";

import { streamLoopAgent } from "./chat";
import { resolveLoopAgentChatModel } from "./model";

type DemoEnv = Record<string, string | undefined>;

interface LoopAgentRequestBody {
  messages?: UIMessage[];
}

interface LoopAgentRequestDependencies {
  streamLoopAgent: (
    messages: UIMessage[],
    env: DemoEnv
  ) => Promise<Response> | Response;
}

export interface LoopAgentRuntimeState {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

const invalidMessagesError = 'Expected a JSON body with a "messages" array.';
const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';

async function readLoopAgentMessages(body: unknown): Promise<UIMessage[]> {
  const { messages } = (body ?? {}) as LoopAgentRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  try {
    return await validateUIMessages({ messages });
  } catch {
    throw new Error(invalidUiMessagesError);
  }
}

export function getLoopAgentRuntimeState(
  env: DemoEnv = appEnv
): LoopAgentRuntimeState {
  const setup = getAiGatewaySetupState(env);

  return {
    chatModel: resolveLoopAgentChatModel(env),
    isChatAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
  };
}

export async function handleLoopAgentRequest(
  request: Request,
  env: DemoEnv = appEnv,
  dependencies: LoopAgentRequestDependencies = {
    streamLoopAgent,
  }
) {
  const runtimeState = getLoopAgentRuntimeState(env);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  try {
    const messages = await readLoopAgentMessages(await request.json());

    return dependencies.streamLoopAgent(messages, env);
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
