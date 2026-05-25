import { type UIMessage, validateUIMessages } from "ai";

import { streamOpenAiAgentsSdkDemo } from "./chat";
import {
  getOpenAiAgentsSdkDemoGuardrailCatalog,
  getOpenAiAgentsSdkDemoGuardrailErrorMessage,
  type OpenAiAgentsSdkDemoGuardrailCatalogEntry,
} from "./guardrails";
import {
  getOpenAiAgentsSdkDemoGuideCoverage,
  type OpenAiAgentsSdkDemoGuideCoverage,
} from "./guide-coverage";
import {
  getOpenAiAgentsSdkDemoChatModel,
  getOpenAiAgentsSdkDemoModelProfile,
  type OpenAiAgentsSdkDemoModelProfile,
} from "./models";
import {
  getOpenAiAgentsSdkDemoToolCatalog,
  type OpenAiAgentsSdkDemoToolCatalogEntry,
} from "./tools";

type DemoEnv = Record<string, string | undefined>;

interface OpenAiAgentsSdkDemoRequestBody {
  messages?: UIMessage[];
}

interface OpenAiAgentsSdkDemoRequestDependencies {
  streamOpenAiAgentsSdkDemo: (
    messages: UIMessage[],
    env: DemoEnv
  ) => Promise<Response> | Response;
}

export interface OpenAiAgentsSdkDemoRuntimeState {
  chatModel: string;
  guardrailCatalog: OpenAiAgentsSdkDemoGuardrailCatalogEntry[];
  guideCoverage: OpenAiAgentsSdkDemoGuideCoverage[];
  isChatAvailable: boolean;
  modelProfile: OpenAiAgentsSdkDemoModelProfile;
  nodeVersion: string;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
  toolCatalog: OpenAiAgentsSdkDemoToolCatalogEntry[];
}

const invalidMessagesError = 'Expected a JSON body with a "messages" array.';
const invalidUiMessagesError =
  'Expected each "messages" entry to match the UIMessage format.';

async function readOpenAiAgentsSdkDemoMessages(body: unknown) {
  const { messages } = (body ?? {}) as OpenAiAgentsSdkDemoRequestBody;

  if (!Array.isArray(messages)) {
    throw new Error(invalidMessagesError);
  }

  try {
    return await validateUIMessages({ messages });
  } catch {
    throw new Error(invalidUiMessagesError);
  }
}

export function getOpenAiAgentsSdkDemoRuntimeState(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoRuntimeState {
  const chatModel = getOpenAiAgentsSdkDemoChatModel(env);
  const issues = env.AI_GATEWAY_API_KEY
    ? []
    : [
        "AI_GATEWAY_API_KEY is missing. Add it to apps/web/.env.local using the contract in apps/web/.env.example.",
      ];
  const isChatAvailable = issues.length === 0;

  return {
    chatModel,
    guardrailCatalog: getOpenAiAgentsSdkDemoGuardrailCatalog({
      isChatAvailable,
    }),
    guideCoverage: getOpenAiAgentsSdkDemoGuideCoverage({ isChatAvailable }),
    isChatAvailable,
    modelProfile: getOpenAiAgentsSdkDemoModelProfile(env),
    nodeVersion: process.version,
    setupMessage: issues.length > 0 ? issues.join(" ") : null,
    statusLabel: isChatAvailable ? "Ready" : "Setup required",
    toolCatalog: getOpenAiAgentsSdkDemoToolCatalog({
      env,
      isChatAvailable,
    }),
  };
}

export async function handleOpenAiAgentsSdkDemoRequest(
  request: Request,
  env: DemoEnv = process.env,
  dependencies: OpenAiAgentsSdkDemoRequestDependencies = {
    streamOpenAiAgentsSdkDemo,
  }
) {
  const runtimeState = getOpenAiAgentsSdkDemoRuntimeState(env);

  if (!runtimeState.isChatAvailable) {
    return Response.json(
      {
        error: runtimeState.setupMessage,
      },
      { status: 500 }
    );
  }

  try {
    const messages = await readOpenAiAgentsSdkDemoMessages(
      await request.json()
    );

    return await dependencies.streamOpenAiAgentsSdkDemo(messages, env);
  } catch (error) {
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

    const guardrailErrorMessage =
      getOpenAiAgentsSdkDemoGuardrailErrorMessage(error);

    if (guardrailErrorMessage) {
      return Response.json(
        {
          error: guardrailErrorMessage,
        },
        { status: 400 }
      );
    }

    throw error;
  }
}
