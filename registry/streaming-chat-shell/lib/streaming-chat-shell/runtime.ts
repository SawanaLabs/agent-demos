import type { UIMessage } from "ai";

import {
  invalidMessagesError,
  invalidUiMessagesError,
  malformedJsonError,
  readStreamingChatShellRequest,
  type StreamingAudience,
  supportedAudiences,
} from "./contract";
import {
  getStreamingChatShellEnv,
  getStreamingChatShellSetupState,
  type StreamingChatShellEnv,
} from "./env";
import { createStreamingTurnUiMessageResponse } from "./streaming-turn";

export interface StreamingChatShellRuntimeState {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
  supportedAudiences: string[];
}

export interface StreamingChatShellRequestOptions {
  audience: StreamingAudience;
}

interface StreamingChatShellRequestDependencies {
  streamStreamingChatShell: (
    messages: UIMessage[],
    env: StreamingChatShellEnv,
    options: StreamingChatShellRequestOptions
  ) => Promise<Response>;
}

export function getStreamingChatShellRuntimeState(
  env: StreamingChatShellEnv = getStreamingChatShellEnv()
): StreamingChatShellRuntimeState {
  const setup = getStreamingChatShellSetupState(env);

  return {
    chatModel: setup.config.chatModel,
    isChatAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
    supportedAudiences: [...supportedAudiences],
  };
}

export function streamStreamingChatShell(
  messages: UIMessage[],
  env: StreamingChatShellEnv,
  options: StreamingChatShellRequestOptions
) {
  return createStreamingTurnUiMessageResponse(messages, env, options.audience);
}

export async function handleStreamingChatShellRequest(
  request: Request,
  env: StreamingChatShellEnv = getStreamingChatShellEnv(),
  dependencies: StreamingChatShellRequestDependencies = {
    streamStreamingChatShell,
  }
) {
  const runtimeState = getStreamingChatShellRuntimeState(env);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  try {
    const { audience, messages } = await readStreamingChatShellRequest(
      await request.json()
    );

    return dependencies.streamStreamingChatShell(messages, env, {
      audience,
    });
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
}
