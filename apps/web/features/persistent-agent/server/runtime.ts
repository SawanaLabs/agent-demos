import {
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

import { env as appEnv } from "@/env";
import {
  createAiGateway,
  getAiGatewayConfig,
  getAiGatewaySetupState,
} from "@/features/shared/ai-gateway/server/env";
import { getDatabaseSetupState } from "@/features/shared/database/server/env";

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

type DemoEnv = Record<string, string | undefined>;

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
  resumeRequiresRedis: boolean;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

function getRedisSetupIssue(env: DemoEnv) {
  return env.REDIS_URL
    ? null
    : "REDIS_URL is missing. Persistent-agent resume requires Redis-backed resumable streams.";
}

export function getPersistentAgentRuntimeState(
  env: DemoEnv = appEnv
): PersistentAgentRuntimeState {
  const gatewaySetup = getAiGatewaySetupState(env);
  const databaseSetup = getDatabaseSetupState(env);
  const issues = [
    ...gatewaySetup.issues,
    ...databaseSetup.issues.map(
      () =>
        "DATABASE_URL is missing. Persistent-agent chat storage requires a writable Postgres database."
    ),
  ];
  const redisIssue = getRedisSetupIssue(env);

  if (redisIssue) {
    issues.push(redisIssue);
  }

  return {
    chatModel: gatewaySetup.config.chatModel,
    cleanupRetentionDays: persistentAgentCleanupRetentionDays,
    cleanupScheduleUtc: persistentAgentCleanupCronScheduleUtc,
    isChatAvailable: issues.length === 0,
    nodeVersion: gatewaySetup.nodeVersion,
    resumeRequiresRedis: true,
    setupMessage: issues.length > 0 ? issues.join(" ") : null,
    statusLabel: issues.length === 0 ? "Ready" : "Setup required",
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

function getRedisUrl(env: DemoEnv) {
  if (!env.REDIS_URL) {
    throw new Error(
      "REDIS_URL is missing. Persistent-agent resume requires Redis-backed resumable streams."
    );
  }

  return env.REDIS_URL;
}

function getStreamContext(env: DemoEnv) {
  if (!persistentAgentStreamPublisher) {
    persistentAgentStreamPublisher = new Redis(getRedisUrl(env), {
      enableReadyCheck: false,
    });
  }

  if (!persistentAgentStreamSubscriber) {
    persistentAgentStreamSubscriber = new Redis(getRedisUrl(env), {
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
  env: DemoEnv = appEnv
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

  const gateway = createAiGateway(env);
  const { chatModel } = getAiGatewayConfig(env);
  const result = streamText({
    model: gateway(chatModel),
    messages: await convertToModelMessages(originalMessages),
    system: persistentAgentSystemPrompt,
  });

  return result.toUIMessageStreamResponse({
    consumeSseStream: async ({ stream }) => {
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
    },
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
