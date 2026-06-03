import {
  consumeStream,
  convertToModelMessages,
  createIdGenerator,
  generateId,
  streamText,
  UI_MESSAGE_STREAM_HEADERS,
  type UIMessage,
} from "ai";
import Redis from "ioredis";
import { after } from "next/dist/server/after";
import { createResumableStreamContext } from "resumable-stream/ioredis";

import {
  createPersistentAgentGateway,
  getPersistentAgentConfig,
  getPersistentAgentEnv,
  getPersistentAgentRedisConfig,
  getPersistentAgentSetupState,
  type PersistentAgentEnv,
} from "./env";
import {
  createPersistentAgentChatStore,
  getPersistentAgentChatNotFoundError,
  persistentAgentCleanupCronScheduleUtc,
  persistentAgentCleanupRetentionDays,
} from "./chat-store";

const invalidRequestBodyError =
  'Expected a JSON body with a non-empty "id" string and a "message" object.';

const persistentAgentSystemPrompt = [
  "You are the Persistent Agent demo in an AI SDK examples workspace.",
  "Answer like an experienced product engineer explaining architecture decisions.",
  "Keep replies concrete and concise.",
].join(" ");

interface PersistentAgentRequestBody {
  id?: string;
  message?: UIMessage;
}

export interface PersistentAgentRuntimeState {
  chatModel: string;
  cleanupRetentionDays: number;
  cleanupScheduleUtc: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  persistenceLabel: string;
  resumeLabel: string;
  resumeRequiresRedis: boolean;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

export function getPersistentAgentRuntimeState(
  env: PersistentAgentEnv = getPersistentAgentEnv()
): PersistentAgentRuntimeState {
  const setup = getPersistentAgentSetupState(env);

  return {
    chatModel: setup.config.chatModel,
    cleanupRetentionDays: persistentAgentCleanupRetentionDays,
    cleanupScheduleUtc: persistentAgentCleanupCronScheduleUtc,
    isChatAvailable: setup.isReady,
    nodeVersion: setup.nodeVersion,
    persistenceLabel: env.DATABASE_URL ? "Postgres" : "In-memory",
    resumeLabel: env.REDIS_URL ? "Redis resume" : "Local stream",
    resumeRequiresRedis: Boolean(env.REDIS_URL),
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
  };
}

function readRequestBody(body: unknown) {
  const { id, message } = (body ?? {}) as PersistentAgentRequestBody;

  if (
    typeof id !== "string" ||
    id.trim().length === 0 ||
    !message ||
    typeof message !== "object"
  ) {
    throw new Error(invalidRequestBodyError);
  }

  return {
    id: id.trim(),
    message,
  };
}

let persistentAgentStreamContext:
  | ReturnType<typeof createResumableStreamContext>
  | undefined;
let persistentAgentStreamPublisher: Redis | undefined;
let persistentAgentStreamSubscriber: Redis | undefined;

function getStreamContext(env: PersistentAgentEnv) {
  const { redisUrl } = getPersistentAgentRedisConfig(env);

  if (!persistentAgentStreamPublisher) {
    persistentAgentStreamPublisher = new Redis(redisUrl, {
      enableReadyCheck: false,
    });
  }

  if (!persistentAgentStreamSubscriber) {
    persistentAgentStreamSubscriber = new Redis(redisUrl, {
      enableReadyCheck: false,
    });
  }

  persistentAgentStreamContext ??= createResumableStreamContext({
    publisher: persistentAgentStreamPublisher,
    subscriber: persistentAgentStreamSubscriber,
    waitUntil: after,
  });

  return persistentAgentStreamContext;
}

export async function handlePersistentAgentChatRequest(
  request: Request,
  viewer: { visitorId: string },
  env: PersistentAgentEnv = getPersistentAgentEnv()
) {
  const runtimeState = getPersistentAgentRuntimeState(env);

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

  let input: { id: string; message: UIMessage };

  try {
    input = readRequestBody(body);
  } catch (error) {
    if (error instanceof Error && error.message === invalidRequestBodyError) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 400 }
      );
    }

    throw error;
  }

  const store = createPersistentAgentChatStore();
  const existingSession = await store.loadChatSession(
    input.id,
    viewer.visitorId
  );
  const originalMessages = existingSession
    ? [...existingSession.messages, input.message]
    : [input.message];

  try {
    await store.saveIncomingUserMessage({
      chatId: input.id,
      message: input.message,
      visitorId: viewer.visitorId,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === getPersistentAgentChatNotFoundError(input.id)
    ) {
      return Response.json(
        {
          error: error.message,
        },
        { status: 404 }
      );
    }

    throw error;
  }

  const gateway = createPersistentAgentGateway(env);
  const { chatModel } = getPersistentAgentConfig(env);
  const result = streamText({
    model: gateway(chatModel),
    messages: await convertToModelMessages(originalMessages),
    system: persistentAgentSystemPrompt,
  });
  const shouldUseRedisResume = Boolean(env.REDIS_URL);

  return result.toUIMessageStreamResponse({
    consumeSseStream: shouldUseRedisResume
      ? async ({ stream }) => {
          const streamId = generateId();
          await getStreamContext(env).createNewResumableStream(
            streamId,
            () => stream
          );
          await store.setActiveStream({
            activeStreamId: streamId,
            chatId: input.id,
            visitorId: viewer.visitorId,
          });
        }
      : consumeStream,
    generateMessageId: createIdGenerator({
      prefix: "pa-msg",
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

export async function handlePersistentAgentStreamResumeRequest(
  chatId: string,
  viewer: { visitorId: string },
  env: PersistentAgentEnv = getPersistentAgentEnv()
) {
  const session = await createPersistentAgentChatStore().loadChatSession(
    chatId,
    viewer.visitorId
  );

  if (!session) {
    return Response.json(
      {
        error: getPersistentAgentChatNotFoundError(chatId),
      },
      { status: 404 }
    );
  }

  if (!session.chat.activeStreamId) {
    return new Response(null, { status: 204 });
  }

  if (!env.REDIS_URL) {
    return new Response(null, { status: 204 });
  }

  return new Response(
    await getStreamContext(env).resumeExistingStream(session.chat.activeStreamId),
    {
      headers: UI_MESSAGE_STREAM_HEADERS,
    }
  );
}

export async function handlePersistentAgentSessionRequest(
  chatId: string,
  viewer: { visitorId: string }
) {
  const session = await createPersistentAgentChatStore().loadChatSession(
    chatId,
    viewer.visitorId
  );

  if (!session) {
    return Response.json(
      {
        error: getPersistentAgentChatNotFoundError(chatId),
      },
      { status: 404 }
    );
  }

  return Response.json(session);
}
