import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
  validateUIMessages,
} from "ai";

import {
  DEFAULT_LANGGRAPH_AGENT_MODEL,
  getLangGraphAgentConfig,
  getLangGraphAgentEnv,
  getLangGraphAgentSetupState,
  type LangGraphAgentEnv,
} from "./env";
import { createRemoteLangGraphClient } from "./remote-langgraph-client";
import { parseLangGraphSseStream } from "./sse-parser";
import { createLangGraphStreamNormalizer } from "./stream-normalizer";

interface LangGraphAgentRequestBody {
  messages?: UIMessage[];
  threadId?: string;
}

export interface LangGraphAgentRuntimeState {
  assistantId: string | null;
  isChatAvailable: boolean;
  modelName: string;
  nodeVersion: string;
  remoteUrl: string | null;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
}

export interface LangGraphAgentStreamInput {
  messages: UIMessage[];
  threadId: string;
}

interface LangGraphAgentClient {
  streamThreadRun: (
    input: Parameters<
      ReturnType<typeof createRemoteLangGraphClient>["streamThreadRun"]
    >[0]
  ) => Promise<Response>;
}

interface LangGraphAgentStreamDependencies {
  client?: LangGraphAgentClient;
}

interface LangGraphAgentRequestDependencies {
  streamLangGraphAgent: (
    input: LangGraphAgentStreamInput,
    env: LangGraphAgentEnv
  ) => Promise<Response> | Response;
}

const invalidRequestError =
  'Expected a JSON body with "messages" array and "threadId" string.';
const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';

function readThreadId(body: LangGraphAgentRequestBody) {
  if (typeof body.threadId !== "string" || !body.threadId.trim()) {
    throw new Error(invalidRequestError);
  }

  return body.threadId;
}

async function readLangGraphAgentInput(
  body: unknown
): Promise<LangGraphAgentStreamInput> {
  const requestBody = (body ?? {}) as LangGraphAgentRequestBody;

  if (!Array.isArray(requestBody.messages)) {
    throw new Error(invalidRequestError);
  }

  try {
    return {
      messages: await validateUIMessages({
        messages: requestBody.messages,
      }),
      threadId: readThreadId(requestBody),
    };
  } catch (error) {
    if (error instanceof Error && error.message === invalidRequestError) {
      throw error;
    }

    throw new Error(invalidUiMessagesError);
  }
}

export function getLangGraphAgentRuntimeState(
  env: LangGraphAgentEnv = getLangGraphAgentEnv()
): LangGraphAgentRuntimeState {
  const setup = getLangGraphAgentSetupState(env);

  return {
    assistantId: setup.config.assistantId ?? null,
    isChatAvailable: setup.isReady,
    modelName: setup.config.modelName ?? DEFAULT_LANGGRAPH_AGENT_MODEL,
    nodeVersion: setup.nodeVersion,
    remoteUrl: setup.config.baseUrl ?? null,
    setupMessage: setup.issues.length > 0 ? setup.issues.join(" ") : null,
    statusLabel: setup.isReady ? "Ready" : "Setup required",
  };
}

export async function streamLangGraphAgent(
  input: LangGraphAgentStreamInput,
  env: LangGraphAgentEnv = getLangGraphAgentEnv(),
  dependencies: LangGraphAgentStreamDependencies = {}
) {
  const config = getLangGraphAgentConfig(env);
  const client =
    dependencies.client ??
    createRemoteLangGraphClient({
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
    });
  const remoteResponse = await client.streamThreadRun({
    assistantId: config.assistantId,
    messages: input.messages,
    threadId: input.threadId,
  });

  if (!remoteResponse.body) {
    throw new Error("LangGraph stream response did not include a body.");
  }

  const normalizer = createLangGraphStreamNormalizer();

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      async execute({ writer }) {
        for await (const event of parseLangGraphSseStream(
          remoteResponse.body as ReadableStream<Uint8Array>
        )) {
          for (const chunk of normalizer.normalize(event)) {
            writer.write(chunk);
          }
        }

        for (const chunk of normalizer.finish()) {
          writer.write(chunk);
        }
      },
      onError(error) {
        return error instanceof Error
          ? error.message
          : "LangGraph agent stream failed.";
      },
    }),
  });
}

export async function handleLangGraphAgentRequest(
  request: Request,
  env: LangGraphAgentEnv = getLangGraphAgentEnv(),
  dependencies: LangGraphAgentRequestDependencies = {
    streamLangGraphAgent,
  }
) {
  const runtimeState = getLangGraphAgentRuntimeState(env);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  try {
    const input = await readLangGraphAgentInput(await request.json());

    return dependencies.streamLangGraphAgent(input, env);
  } catch (error) {
    if (
      error instanceof Error &&
      [invalidRequestError, invalidUiMessagesError].includes(error.message)
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
