import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { env as appEnv } from "@/env";

import {
  createAiGateway,
  getAiGatewayConfig,
  getAiGatewaySetupState,
} from "@/features/shared/ai-gateway/server/env";

const systemPrompt = [
  "You are the foundation chat demo in a production-ready agent demos monorepo.",
  "Keep answers concise, direct, and useful to engineers evaluating the stack.",
  "When a request is ambiguous, surface the assumption clearly and keep moving.",
].join(" ");
const invalidMessagesError = 'Expected a JSON body with a "messages" array.';

type DemoEnv = Record<string, string | undefined>;

interface FoundationChatRequestBody {
  messages?: UIMessage[];
}

export interface FoundationChatRuntimeState {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

function buildFoundationChatRuntimeState(
  env: DemoEnv
): FoundationChatRuntimeState {
  const setup = getAiGatewaySetupState(env);

  return {
    chatModel: setup.config.chatModel,
    isChatAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
  };
}

export function getFoundationChatRuntimeState(
  env: DemoEnv = appEnv
): FoundationChatRuntimeState {
  return buildFoundationChatRuntimeState(env);
}

function readFoundationChatMessages(body: unknown): UIMessage[] {
  const { messages } = (body ?? {}) as FoundationChatRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  return messages;
}

async function streamFoundationChat(messages: UIMessage[], env: DemoEnv) {
  const gateway = createAiGateway(env);
  const { chatModel } = getAiGatewayConfig(env);

  const result = streamText({
    model: gateway(chatModel),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

export async function handleFoundationChatRequest(
  request: Request,
  env: DemoEnv = appEnv
) {
  const runtimeState = getFoundationChatRuntimeState(env);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  const body = await request.json();

  try {
    return await streamFoundationChat(readFoundationChatMessages(body), env);
  } catch (error) {
    if (error instanceof Error && error.message === invalidMessagesError) {
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
