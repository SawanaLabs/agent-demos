import {
  convertToModelMessages,
  createIdGenerator,
  generateId,
  stepCountIs,
  streamText,
  UI_MESSAGE_STREAM_HEADERS,
  type UIMessage,
} from "ai";
import Redis from "ioredis";
import { after } from "next/dist/server/after";
import { createResumableStreamContext } from "resumable-stream/ioredis";

import { env as appEnv } from "@/env";
import { getAiGatewaySetupState } from "@/features/shared/ai-gateway/server/env";
import { getDatabaseSetupState } from "@/features/shared/database/server/env";

import {
  createUltraChatbotAgentChatStore,
  getUltraChatbotAgentChatNotFoundError,
} from "./chat-store";
import { createUltraChatbotAgentCreateDocumentTool } from "./create-document";
import { createUltraChatbotAgentEditDocumentTool } from "./edit-document";
import { createUltraChatbotAgentGetWeatherTool } from "./get-weather";
import { createUltraChatbotAgentRequestSuggestionsTool } from "./request-suggestions";
import { createUltraChatbotAgentUpdateDocumentTool } from "./update-document";
import {
  getUltraChatbotAgentDefaultModel,
  getUltraChatbotAgentModelCatalog,
  isUltraChatbotAgentModelId,
  resolveUltraChatbotAgentDefaultModel,
} from "./models";
import { getUltraChatbotAgentSystemPrompt } from "./prompts";
import { createUltraChatbotAgentProvider } from "./providers";

const invalidRequestBodyError =
  'Expected a JSON body with a non-empty "id" string, "message" object, "selectedChatModel" string, and "selectedVisibilityType".';

type DemoEnv = Record<string, string | undefined>;

interface UltraChatbotAgentRequestBody {
  id?: string;
  message?: UIMessage;
  selectedChatModel?: string;
  selectedVisibilityType?: "private" | "public";
}

export interface UltraChatbotAgentRuntimeState {
  chatModel: string;
  isChatAvailable: boolean;
  models: ReturnType<typeof getUltraChatbotAgentModelCatalog>;
  nodeVersion: string;
  resumeRequiresRedis: boolean;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

function getRedisSetupIssue(env: DemoEnv) {
  return env.REDIS_URL
    ? null
    : "REDIS_URL is missing. Ultra-chatbot-agent resume requires Redis-backed resumable streams.";
}

export function getUltraChatbotAgentRuntimeState(
  env: DemoEnv = appEnv
): UltraChatbotAgentRuntimeState {
  const gatewaySetup = getAiGatewaySetupState(env);
  const databaseSetup = getDatabaseSetupState(env);
  const issues = [
    ...gatewaySetup.issues,
    ...databaseSetup.issues.map(
      () =>
        "DATABASE_URL is missing. Ultra-chatbot-agent storage requires a writable Postgres database."
    ),
  ];
  const redisIssue = getRedisSetupIssue(env);

  if (redisIssue) {
    issues.push(redisIssue);
  }

  return {
    chatModel: resolveUltraChatbotAgentDefaultModel(
      gatewaySetup.config.chatModel
    ),
    isChatAvailable: issues.length === 0,
    models: getUltraChatbotAgentModelCatalog(),
    nodeVersion: gatewaySetup.nodeVersion,
    resumeRequiresRedis: true,
    setupMessage: issues.length > 0 ? issues.join(" ") : null,
    statusLabel: issues.length === 0 ? "Ready" : "Setup required",
  };
}

function readRequestBody(body: unknown) {
  const { id, message, selectedChatModel, selectedVisibilityType } = (body ??
    {}) as UltraChatbotAgentRequestBody;

  if (
    typeof id !== "string" ||
    id.trim().length === 0 ||
    !message ||
    typeof message !== "object" ||
    typeof selectedChatModel !== "string" ||
    (selectedVisibilityType !== "private" &&
      selectedVisibilityType !== "public")
  ) {
    throw new Error(invalidRequestBodyError);
  }

  return {
    id: id.trim(),
    message,
    selectedChatModel,
    selectedVisibilityType,
  };
}

let ultraChatbotAgentStreamContext:
  | ReturnType<typeof createResumableStreamContext>
  | undefined;
let ultraChatbotAgentStreamPublisher: Redis | undefined;
let ultraChatbotAgentStreamSubscriber: Redis | undefined;

function getRedisUrl(env: DemoEnv) {
  if (!env.REDIS_URL) {
    throw new Error(
      "REDIS_URL is missing. Ultra-chatbot-agent resume requires Redis-backed resumable streams."
    );
  }

  return env.REDIS_URL;
}

function getStreamContext(env: DemoEnv) {
  if (!ultraChatbotAgentStreamPublisher) {
    ultraChatbotAgentStreamPublisher = new Redis(getRedisUrl(env), {
      enableReadyCheck: false,
    });
  }

  if (!ultraChatbotAgentStreamSubscriber) {
    ultraChatbotAgentStreamSubscriber = new Redis(getRedisUrl(env), {
      enableReadyCheck: false,
    });
  }

  ultraChatbotAgentStreamContext ??= createResumableStreamContext({
    publisher: ultraChatbotAgentStreamPublisher,
    subscriber: ultraChatbotAgentStreamSubscriber,
    waitUntil: after,
  });

  return ultraChatbotAgentStreamContext;
}

export async function handleUltraChatbotAgentChatRequest(
  request: Request,
  viewer: { visitorId: string },
  env: DemoEnv = appEnv
) {
  const runtimeState = getUltraChatbotAgentRuntimeState(env);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        error: "Expected a valid JSON request body.",
      },
      { status: 400 }
    );
  }

  let input: {
    id: string;
    message: UIMessage;
    selectedChatModel: string;
    selectedVisibilityType: "private" | "public";
  };

  try {
    input = readRequestBody(body);
  } catch (error) {
    if (error instanceof Error && error.message === invalidRequestBodyError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }

  if (!isUltraChatbotAgentModelId(input.selectedChatModel)) {
    return Response.json(
      {
        error: `Unsupported selectedChatModel "${input.selectedChatModel}".`,
      },
      { status: 400 }
    );
  }

  const store = createUltraChatbotAgentChatStore();
  const existingSession = await store.loadChatSession(input.id, viewer.visitorId);
  const originalMessages = existingSession
    ? [...existingSession.messages, input.message]
    : [input.message];

  try {
    await store.saveIncomingUserMessage({
      chatId: input.id,
      message: input.message,
      selectedChatModel: input.selectedChatModel,
      selectedVisibilityType: input.selectedVisibilityType,
      visitorId: viewer.visitorId,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === getUltraChatbotAgentChatNotFoundError(input.id)
    ) {
      return Response.json({ error: error.message }, { status: 404 });
    }

    throw error;
  }

  const provider = createUltraChatbotAgentProvider(env);
  const modelId = provider.resolveModelId(input.selectedChatModel);

  const result = streamText({
    model: provider.gateway(modelId),
    messages: await convertToModelMessages(originalMessages),
    stopWhen: stepCountIs(20),
    system: getUltraChatbotAgentSystemPrompt(),
    tools: {
      createDocument: createUltraChatbotAgentCreateDocumentTool({
        chatId: input.id,
        visitorId: viewer.visitorId,
      }),
      editDocument: createUltraChatbotAgentEditDocumentTool({
        chatId: input.id,
        visitorId: viewer.visitorId,
      }),
      getWeather: createUltraChatbotAgentGetWeatherTool(),
      requestSuggestions: createUltraChatbotAgentRequestSuggestionsTool({
        chatId: input.id,
        model: provider.gateway(modelId),
        visitorId: viewer.visitorId,
      }),
      updateDocument: createUltraChatbotAgentUpdateDocumentTool({
        chatId: input.id,
        model: provider.gateway(modelId),
        visitorId: viewer.visitorId,
      }),
    },
  });

  return result.toUIMessageStreamResponse({
    consumeSseStream: async ({ stream }) => {
      const streamId = generateId();
      await getStreamContext(env).createNewResumableStream(streamId, () => stream);
      await store.setActiveStream({
        activeStreamId: streamId,
        chatId: input.id,
        visitorId: viewer.visitorId,
      });
    },
    generateMessageId: createIdGenerator({
      prefix: "ua-msg",
      size: 16,
    }),
    onFinish: async ({ isAborted, messages }) => {
      if (isAborted) {
        return;
      }

      await store.saveFinishedMessages({
        chatId: input.id,
        messages,
        visitorId: viewer.visitorId,
      });
    },
    originalMessages,
  });
}

export async function handleUltraChatbotAgentStreamResumeRequest(
  chatId: string,
  viewer: { visitorId: string }
) {
  const session = await createUltraChatbotAgentChatStore().loadChatSession(
    chatId,
    viewer.visitorId
  );

  if (!session) {
    return Response.json(
      {
        error: getUltraChatbotAgentChatNotFoundError(chatId),
      },
      { status: 404 }
    );
  }

  if (!session.chat.activeStreamId) {
    return new Response(null, { status: 204 });
  }

  return new Response(
    await getStreamContext(appEnv).resumeExistingStream(
      session.chat.activeStreamId
    ),
    {
      headers: UI_MESSAGE_STREAM_HEADERS,
    }
  );
}

export async function handleUltraChatbotAgentSessionRequest(
  chatId: string,
  viewer: { visitorId: string }
) {
  const session = await createUltraChatbotAgentChatStore().loadChatSession(
    chatId,
    viewer.visitorId
  );

  if (!session) {
    return Response.json(
      {
        error: getUltraChatbotAgentChatNotFoundError(chatId),
      },
      { status: 404 }
    );
  }

  return Response.json(session);
}
