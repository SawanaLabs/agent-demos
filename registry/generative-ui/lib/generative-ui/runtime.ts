import { type UIMessage, validateUIMessages } from "ai";

import {
  type GenerativeUiEnv,
  getGenerativeUiEnv,
  getGenerativeUiSetupState,
} from "./env";

interface GenerativeUiRequestBody {
  messages?: UIMessage[];
}

export interface GenerativeUiRuntimeState {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

interface GenerativeUiRequestDependencies {
  streamGenerativeUiChat: (
    messages: UIMessage[],
    env: GenerativeUiEnv
  ) => Promise<Response>;
}

const invalidMessagesError = 'Expected a JSON body with a "messages" array.';
const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';
const malformedJsonError = "Expected a valid JSON request body.";

export function getGenerativeUiRuntimeState(
  env: GenerativeUiEnv = getGenerativeUiEnv()
): GenerativeUiRuntimeState {
  const setup = getGenerativeUiSetupState(env);

  return {
    chatModel: setup.config.chatModel,
    isChatAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
  };
}

async function readGenerativeUiMessages(body: unknown): Promise<UIMessage[]> {
  const { messages } = (body ?? {}) as GenerativeUiRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  try {
    return await validateUIMessages({ messages });
  } catch {
    throw new Error(invalidUiMessagesError);
  }
}

async function streamGenerativeUiChatFromRuntime(
  messages: UIMessage[],
  env: GenerativeUiEnv
) {
  const { streamGenerativeUiChat } = await import("./chat");

  return streamGenerativeUiChat(messages, env);
}

export async function handleGenerativeUiRequest(
  request: Request,
  env: GenerativeUiEnv = getGenerativeUiEnv(),
  dependencies: GenerativeUiRequestDependencies = {
    streamGenerativeUiChat: streamGenerativeUiChatFromRuntime,
  }
) {
  const runtimeState = getGenerativeUiRuntimeState(env);

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
    messages = await readGenerativeUiMessages(await request.json());
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json(
        {
          error: malformedJsonError,
        },
        { status: 400 }
      );
    }

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

  return dependencies.streamGenerativeUiChat(messages, env);
}
