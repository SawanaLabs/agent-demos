import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";

import {
  createAiGateway,
  getAiGatewayConfig,
  getAiGatewaySetupState,
} from "@/features/shared/ai-gateway/server/env";

import {
  invalidMessagesError,
  invalidUiMessagesError,
  malformedJsonError,
  readStreamingChatShellRequest,
  supportedAudiences,
  type StreamingAudience,
} from "./contract";
import { buildAudienceSystemPrompt } from "./prompt";

type DemoEnv = Record<string, string | undefined>;

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
    env: DemoEnv,
    options: StreamingChatShellRequestOptions
  ) => Promise<Response>;
}

export function getStreamingChatShellRuntimeState(
  env: DemoEnv = process.env
): StreamingChatShellRuntimeState {
  const setup = getAiGatewaySetupState(env);

  return {
    chatModel: setup.config.chatModel,
    isChatAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
    supportedAudiences: [...supportedAudiences],
  };
}

export async function streamStreamingChatShell(
  messages: UIMessage[],
  env: DemoEnv,
  options: StreamingChatShellRequestOptions
) {
  const gateway = createAiGateway(env);
  const { chatModel } = getAiGatewayConfig(env);

  const result = streamText({
    model: gateway(chatModel),
    system: buildAudienceSystemPrompt(options.audience),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

export async function handleStreamingChatShellRequest(
  request: Request,
  env: DemoEnv = process.env,
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
