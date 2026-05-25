import {
  convertToModelMessages,
  createGateway,
  streamText,
  type UIMessage,
} from "ai";

const DEFAULT_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v3/ai";
const DEFAULT_CHAT_MODEL = "openai/gpt-4.1-mini";
const invalidMessagesError = 'Expected a JSON body with a "messages" array.';

type FoundationChatEnv = Record<string, string | undefined>;

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

function readRequiredEnv(env: FoundationChatEnv, name: string) {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env.local before using chat.`);
  }

  return value;
}

function readFoundationChatEnv(): FoundationChatEnv {
  // biome-ignore lint/style/noProcessEnv: Registry source installs into consumer apps without this repo's env wrapper.
  return process.env;
}

function getFoundationChatConfig(
  env: FoundationChatEnv = readFoundationChatEnv()
) {
  return {
    apiKey: readRequiredEnv(env, "AI_GATEWAY_API_KEY"),
    baseURL: env.AI_GATEWAY_BASE_URL || DEFAULT_GATEWAY_BASE_URL,
    chatModel: env.AI_GATEWAY_CHAT_MODEL || DEFAULT_CHAT_MODEL,
  };
}

export function getFoundationChatRuntimeState(
  env: FoundationChatEnv = readFoundationChatEnv()
): FoundationChatRuntimeState {
  const issues: string[] = [];

  if (!env.AI_GATEWAY_API_KEY) {
    issues.push(
      "AI_GATEWAY_API_KEY is missing. The page can render, but chat requests will fail until it is configured."
    );
  }

  return {
    chatModel: env.AI_GATEWAY_CHAT_MODEL || DEFAULT_CHAT_MODEL,
    isChatAvailable: issues.length === 0,
    nodeVersion: process.version,
    setupMessage: issues.length > 0 ? issues.join(" ") : null,
    statusLabel: issues.length === 0 ? "Ready" : "Setup required",
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
  env: FoundationChatEnv
) {
  const { apiKey, baseURL, chatModel } = getFoundationChatConfig(env);
  const gateway = createGateway({ apiKey, baseURL });
  const result = streamText({
    model: gateway(chatModel),
    system: [
      "You are the foundation chat demo in a production-ready agent demos project.",
      "Keep answers concise, direct, and useful to engineers evaluating the stack.",
      "When a request is ambiguous, surface the assumption clearly and keep moving.",
    ].join(" "),
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}

export async function handleFoundationChatRequest(
  request: Request,
  env: FoundationChatEnv = readFoundationChatEnv()
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
