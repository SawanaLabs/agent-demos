import { createHash } from "node:crypto";

import OpenAI from "openai";
import type { ClientSecretCreateResponse } from "openai/resources/realtime";
import { z } from "zod";

type DemoEnv = Record<string, string | undefined>;

const openAiApiKeyEnvVar = "OPENAI_API_KEY";
const voiceClientSecretRoutePath =
  "/api/demos/openai-agents-sdk-demo/realtime/client-secrets" as const;
const defaultVoiceSessionModel = "gpt-realtime-2" as const;
const defaultVoiceSessionVoice = "marin" as const;
const defaultVoiceClientSecretTtlSeconds = 600 as const;
const invalidRequestBodyError =
  'Expected a JSON body with an optional "sessionId" string.';

const voiceClientSecretRequestBodySchema = z.object({
  sessionId: z.string().trim().min(1).max(200).optional(),
});

interface OpenAiAgentsSdkDemoVoiceClientSecretRequestBody {
  sessionId?: string;
}

export interface OpenAiAgentsSdkDemoVoiceClientSecretRouteState {
  openAiApiKeyEnvVar: typeof openAiApiKeyEnvVar;
  routePath: typeof voiceClientSecretRoutePath;
  sdkPrimitive: "client.realtime.clientSecrets.create()";
  sessionModel: typeof defaultVoiceSessionModel;
  sessionVoice: typeof defaultVoiceSessionVoice;
  status: "configured" | "setup-required";
}

export type OpenAiAgentsSdkDemoVoiceClientSecretResponse =
  ClientSecretCreateResponse;

interface OpenAiAgentsSdkDemoVoiceClientSecretDependencies {
  createClientSecret: (options: {
    apiKey: string;
    params: {
      expires_after: {
        anchor: "created_at";
        seconds: typeof defaultVoiceClientSecretTtlSeconds;
      };
      session: {
        audio: {
          output: {
            voice: typeof defaultVoiceSessionVoice;
          };
        };
        model: typeof defaultVoiceSessionModel;
        type: "realtime";
      };
    };
    safetyIdentifier: string;
  }) => Promise<OpenAiAgentsSdkDemoVoiceClientSecretResponse>;
}

function getRequiredOpenAiApiKey(env: DemoEnv = process.env) {
  const apiKey = env[openAiApiKeyEnvVar];

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Voice Agents client-secret minting requires a native OpenAI API key; AI Gateway keys do not work for this realtime route."
    );
  }

  return apiKey;
}

function getOpenAiAgentsSdkDemoVoiceClientSecretParams() {
  return {
    expires_after: {
      anchor: "created_at" as const,
      seconds: defaultVoiceClientSecretTtlSeconds,
    },
    session: {
      audio: {
        output: {
          voice: defaultVoiceSessionVoice,
        },
      },
      model: defaultVoiceSessionModel,
      type: "realtime" as const,
    },
  };
}

function getOpenAiAgentsSdkDemoVoiceSafetyIdentifier(sessionId?: string) {
  return createHash("sha256")
    .update(`openai-agents-sdk-demo:${sessionId ?? "anonymous"}`)
    .digest("hex");
}

async function createOpenAiAgentsSdkDemoVoiceClientSecret({
  apiKey,
  params,
  safetyIdentifier,
}: Parameters<
  OpenAiAgentsSdkDemoVoiceClientSecretDependencies["createClientSecret"]
>[0]): Promise<OpenAiAgentsSdkDemoVoiceClientSecretResponse> {
  const client = new OpenAI({
    apiKey,
  });

  const response = await client.realtime.clientSecrets.create(params, {
    headers: {
      "OpenAI-Safety-Identifier": safetyIdentifier,
    },
  });

  return response;
}

async function readOpenAiAgentsSdkDemoVoiceClientSecretBody(request: Request) {
  const bodyText = await request.text();

  if (!bodyText.trim()) {
    return {} satisfies OpenAiAgentsSdkDemoVoiceClientSecretRequestBody;
  }

  try {
    return voiceClientSecretRequestBodySchema.parse(JSON.parse(bodyText));
  } catch {
    throw new Error(invalidRequestBodyError);
  }
}

export function getOpenAiAgentsSdkDemoVoiceClientSecretRouteState(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoVoiceClientSecretRouteState {
  return {
    openAiApiKeyEnvVar,
    routePath: voiceClientSecretRoutePath,
    sdkPrimitive: "client.realtime.clientSecrets.create()",
    sessionModel: defaultVoiceSessionModel,
    sessionVoice: defaultVoiceSessionVoice,
    status: env[openAiApiKeyEnvVar] ? "configured" : "setup-required",
  };
}

export async function handleOpenAiAgentsSdkDemoVoiceClientSecretRequest(
  request: Request,
  env: DemoEnv = process.env,
  dependencies: OpenAiAgentsSdkDemoVoiceClientSecretDependencies = {
    createClientSecret: createOpenAiAgentsSdkDemoVoiceClientSecret,
  }
) {
  try {
    const body = await readOpenAiAgentsSdkDemoVoiceClientSecretBody(request);
    const params = getOpenAiAgentsSdkDemoVoiceClientSecretParams();
    const response = await dependencies.createClientSecret({
      apiKey: getRequiredOpenAiApiKey(env),
      params,
      safetyIdentifier: getOpenAiAgentsSdkDemoVoiceSafetyIdentifier(
        body.sessionId
      ),
    });

    return Response.json(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to mint client secret.";
    const status = message === invalidRequestBodyError ? 400 : 500;

    return Response.json(
      {
        error: message,
      },
      { status }
    );
  }
}
