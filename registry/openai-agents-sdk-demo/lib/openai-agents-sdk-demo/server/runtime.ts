import { type UIMessage, validateUIMessages } from "ai";

import { getOpenAiAgentsSdkDemoApprovalErrorMessage } from "./approvals";
import { streamOpenAiAgentsSdkDemo } from "./chat";
import {
  getOpenAiAgentsSdkDemoContextProfile,
  type OpenAiAgentsSdkDemoContextProfile,
} from "./context";
import {
  getOpenAiAgentsSdkDemoAiSdkExtensionProfile,
  type OpenAiAgentsSdkDemoAiSdkExtensionProfile,
} from "./extensions";
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
  getOpenAiAgentsSdkDemoHandoffCatalog,
  type OpenAiAgentsSdkDemoHandoffCatalogEntry,
} from "./handoffs";
import {
  getOpenAiAgentsSdkDemoMcpCatalog,
  getOpenAiAgentsSdkDemoMcpProfile,
  type OpenAiAgentsSdkDemoMcpCatalogEntry,
  type OpenAiAgentsSdkDemoMcpProfile,
} from "./mcp";
import {
  getOpenAiAgentsSdkDemoChatModel,
  getOpenAiAgentsSdkDemoModelProfile,
  getOpenAiAgentsSdkDemoProviderErrorMessage,
  type OpenAiAgentsSdkDemoModelProfile,
} from "./models";
import {
  getOpenAiAgentsSdkDemoRunInputErrorMessage,
  getOpenAiAgentsSdkDemoRunProfile,
  type OpenAiAgentsSdkDemoRunProfile,
} from "./running";
import {
  getOpenAiAgentsSdkDemoSandboxProfile,
  type OpenAiAgentsSdkDemoSandboxProfile,
} from "./sandbox";
import {
  getOpenAiAgentsSdkDemoSessionProfile,
  type OpenAiAgentsSdkDemoSessionProfile,
} from "./sessions";
import {
  getOpenAiAgentsSdkDemoToolCatalog,
  type OpenAiAgentsSdkDemoToolCatalogEntry,
} from "./tools";
import {
  getOpenAiAgentsSdkDemoTraceProfile,
  type OpenAiAgentsSdkDemoTraceProfile,
} from "./tracing";
import {
  getOpenAiAgentsSdkDemoVoiceProfile,
  type OpenAiAgentsSdkDemoVoiceProfile,
} from "./voice";
import { getOpenAiAgentsSdkDemoVoiceClientSecretRouteState } from "./voice-realtime";

type DemoEnv = Record<string, string | undefined>;

interface OpenAiAgentsSdkDemoRequestBody {
  messages?: UIMessage[];
}

interface OpenAiAgentsSdkDemoRequestDependencies {
  streamOpenAiAgentsSdkDemo: (
    messages: UIMessage[],
    env: DemoEnv,
    options?: {
      origin?: string;
      signal?: AbortSignal;
    }
  ) => Promise<Response> | Response;
}

export interface OpenAiAgentsSdkDemoRuntimeState {
  aiSdkExtensionProfile: OpenAiAgentsSdkDemoAiSdkExtensionProfile;
  chatModel: string;
  contextProfile: OpenAiAgentsSdkDemoContextProfile;
  guardrailCatalog: OpenAiAgentsSdkDemoGuardrailCatalogEntry[];
  guideCoverage: OpenAiAgentsSdkDemoGuideCoverage[];
  handoffCatalog: OpenAiAgentsSdkDemoHandoffCatalogEntry[];
  isChatAvailable: boolean;
  mcpCatalog: OpenAiAgentsSdkDemoMcpCatalogEntry[];
  mcpProfile: OpenAiAgentsSdkDemoMcpProfile;
  modelProfile: OpenAiAgentsSdkDemoModelProfile;
  nodeVersion: string;
  runProfile: OpenAiAgentsSdkDemoRunProfile;
  sandboxProfile: OpenAiAgentsSdkDemoSandboxProfile;
  sessionProfile: OpenAiAgentsSdkDemoSessionProfile;
  setupMessage: string | null;
  statusLabel: "Ready" | "Setup required";
  toolCatalog: OpenAiAgentsSdkDemoToolCatalogEntry[];
  traceProfile: OpenAiAgentsSdkDemoTraceProfile;
  voiceProfile: OpenAiAgentsSdkDemoVoiceProfile;
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
  const voiceRouteState =
    getOpenAiAgentsSdkDemoVoiceClientSecretRouteState(env);
  const issues = env.AI_GATEWAY_API_KEY
    ? []
    : [
        "AI_GATEWAY_API_KEY is missing. Add it to your installed Next.js app's .env.local before running this registry demo.",
      ];
  const isChatAvailable = issues.length === 0;

  return {
    aiSdkExtensionProfile: getOpenAiAgentsSdkDemoAiSdkExtensionProfile(),
    chatModel,
    contextProfile: getOpenAiAgentsSdkDemoContextProfile(),
    guardrailCatalog: getOpenAiAgentsSdkDemoGuardrailCatalog({
      isChatAvailable,
    }),
    guideCoverage: getOpenAiAgentsSdkDemoGuideCoverage({
      isChatAvailable,
      isVoiceProviderAvailable: voiceRouteState.status === "configured",
    }),
    handoffCatalog: getOpenAiAgentsSdkDemoHandoffCatalog({
      isChatAvailable,
    }),
    isChatAvailable,
    mcpCatalog: getOpenAiAgentsSdkDemoMcpCatalog(),
    mcpProfile: getOpenAiAgentsSdkDemoMcpProfile(),
    modelProfile: getOpenAiAgentsSdkDemoModelProfile(env),
    nodeVersion: process.version,
    runProfile: getOpenAiAgentsSdkDemoRunProfile(env),
    sandboxProfile: getOpenAiAgentsSdkDemoSandboxProfile(),
    sessionProfile: getOpenAiAgentsSdkDemoSessionProfile(),
    setupMessage: issues.length > 0 ? issues.join(" ") : null,
    traceProfile: getOpenAiAgentsSdkDemoTraceProfile(env),
    statusLabel: isChatAvailable ? "Ready" : "Setup required",
    toolCatalog: getOpenAiAgentsSdkDemoToolCatalog({
      env,
      isChatAvailable,
    }),
    voiceProfile: getOpenAiAgentsSdkDemoVoiceProfile(env),
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

    return await dependencies.streamOpenAiAgentsSdkDemo(messages, env, {
      origin: new URL(request.url).origin,
      signal: request.signal,
    });
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

    const approvalErrorMessage =
      getOpenAiAgentsSdkDemoApprovalErrorMessage(error);

    if (approvalErrorMessage) {
      return Response.json(
        {
          error: approvalErrorMessage,
        },
        { status: 400 }
      );
    }

    const runInputErrorMessage =
      getOpenAiAgentsSdkDemoRunInputErrorMessage(error);

    if (runInputErrorMessage) {
      return Response.json(
        {
          error: runInputErrorMessage,
        },
        { status: 400 }
      );
    }

    const providerErrorMessage =
      getOpenAiAgentsSdkDemoProviderErrorMessage(error);

    if (providerErrorMessage) {
      return Response.json(
        {
          error: providerErrorMessage,
        },
        { status: 400 }
      );
    }

    throw error;
  }
}
