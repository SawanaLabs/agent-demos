import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  createFoundationChatGateway,
  getFoundationChatConfig,
  getFoundationChatSetupState,
  type FoundationChatEnv,
} from "./env";

const systemPrompt = [
  "You are the foundation chat demo in a production-ready agent demos monorepo.",
  "Keep answers concise, direct, and useful to engineers evaluating the stack.",
  "When a request is ambiguous, surface the assumption clearly and keep moving.",
].join(" ");
const invalidMessagesError = 'Expected a JSON body with a "messages" array.';

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

export function getFoundationChatRuntimeState(
  env?: FoundationChatEnv
): FoundationChatRuntimeState {
  const setup = getFoundationChatSetupState(env);

  return {
    chatModel: setup.config.chatModel,
    isChatAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
  };
}

function readFoundationChatMessages(body: unknown): UIMessage[] {
  const { messages } = (body ?? {}) as FoundationChatRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  return messages;
}

async function streamFoundationChat(
  messages: UIMessage[],
  env?: FoundationChatEnv
) {
  const gateway = createFoundationChatGateway(env);
  const { chatModel } = getFoundationChatConfig(env);

  const result = streamText({
    model: gateway(chatModel),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

export async function handleFoundationChatRequest(
  request: Request,
  env?: FoundationChatEnv
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
