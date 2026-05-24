import { type UIMessage, validateUIMessages } from "ai";
import { env as appEnv } from "@/env";

import { getAiGatewaySetupState } from "@/features/shared/ai-gateway/server/env";
import { getVercelSandboxSetupState } from "@/features/shared/vercel-sandbox/server/env";
import { streamSandboxAgent } from "./chat";
import { resolveSandboxAgentChatModel } from "./model";
import { SANDBOX_AGENT_PREVIEW_PORT } from "./session";

type DemoEnv = Record<string, string | undefined>;

interface SandboxAgentRequestBody {
  id?: string;
  messages?: UIMessage[];
}

interface StreamSandboxAgentOptions {
  previewPort: number;
  sessionId: string;
}

interface SandboxAgentRequestDependencies {
  streamSandboxAgent: (
    messages: UIMessage[],
    options: StreamSandboxAgentOptions
  ) => Promise<Response> | Response;
}

export interface SandboxAgentRuntimeState {
  chatModel: string;
  isChatAvailable: boolean;
  nodeVersion: string;
  previewPort: number;
  sandboxProvider: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
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

export function getSandboxAgentRuntimeState(
  env: DemoEnv = appEnv
): SandboxAgentRuntimeState {
  const gatewaySetup = getAiGatewaySetupState(env);
  const sandboxSetup = getVercelSandboxSetupState(env);
  const issues = [...gatewaySetup.issues, ...sandboxSetup.issues];

  return {
    chatModel: resolveSandboxAgentChatModel(env),
    isChatAvailable: issues.length === 0,
    nodeVersion: gatewaySetup.nodeVersion,
    previewPort: SANDBOX_AGENT_PREVIEW_PORT,
    sandboxProvider: sandboxSetup.providerLabel,
    setupMessage: issues.length > 0 ? issues.join(" ") : null,
    statusLabel: issues.length === 0 ? "Ready" : "Setup required",
  };
}

export async function handleSandboxAgentRequest(
  request: Request,
  env: DemoEnv = appEnv,
  dependencies: Partial<SandboxAgentRequestDependencies> = {
    streamSandboxAgent: (messages, options) =>
      streamSandboxAgent(messages, {
        env,
        previewPort: options.previewPort,
        sessionId: options.sessionId,
      }),
  }
) {
  const streamAgent =
    dependencies.streamSandboxAgent ??
    ((messages: UIMessage[], options: StreamSandboxAgentOptions) =>
      streamSandboxAgent(messages, {
        env,
        previewPort: options.previewPort,
        sessionId: options.sessionId,
      }));
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
