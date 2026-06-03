import { type UIMessage, validateUIMessages } from "ai";

import { getSandboxAgentEnv } from "./env";
import { getSandboxAgentRuntimeState } from "./runtime";

interface SandboxAgentRequestBody {
  id?: string;
  messages?: UIMessage[];
}

interface StreamSandboxAgentOptions {
  localPreviewBaseUrl: string;
  previewPort: number;
  sessionId: string;
}

interface SandboxAgentRequestDependencies {
  streamSandboxAgent: (
    messages: UIMessage[],
    options: StreamSandboxAgentOptions
  ) => Promise<Response> | Response;
}

const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';
const invalidChatIdError =
  'Expected a JSON body with an "id" string and a "messages" array.';

async function readSandboxAgentRequest(
  body: unknown
): Promise<{ messages: UIMessage[]; sessionId: string }> {
  const { id, messages } = (body ?? {}) as SandboxAgentRequestBody;

  if (!(typeof id === "string" && id.length > 0 && Array.isArray(messages))) {
    throw new Error(invalidChatIdError);
  }

  try {
    return {
      messages: await validateUIMessages({ messages }),
      sessionId: id,
    };
  } catch {
    throw new Error(invalidUiMessagesError);
  }
}

export async function handleSandboxAgentRequest(
  request: Request,
  env = getSandboxAgentEnv(),
  dependencies: Partial<SandboxAgentRequestDependencies> = {
    streamSandboxAgent: async (messages, options) => {
      const { streamSandboxAgent } = await import("./chat");

      return streamSandboxAgent(messages, {
        env,
        localPreviewBaseUrl: options.localPreviewBaseUrl,
        previewPort: options.previewPort,
        sessionId: options.sessionId,
      });
    },
  }
) {
  const streamAgent =
    dependencies.streamSandboxAgent ??
    (async (messages: UIMessage[], options: StreamSandboxAgentOptions) => {
      const { streamSandboxAgent } = await import("./chat");

      return streamSandboxAgent(messages, {
        env,
        localPreviewBaseUrl: options.localPreviewBaseUrl,
        previewPort: options.previewPort,
        sessionId: options.sessionId,
      });
    });
  const runtimeState = getSandboxAgentRuntimeState(env);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  try {
    const { messages, sessionId } = await readSandboxAgentRequest(
      await request.json()
    );

    return streamAgent(messages, {
      localPreviewBaseUrl: new URL(request.url).origin,
      previewPort: runtimeState.previewPort,
      sessionId,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      [invalidUiMessagesError, invalidChatIdError].includes(error.message)
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
