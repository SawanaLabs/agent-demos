import { z } from "zod";

import { buildOpenAiAgentsSdkDemoSipInitialConfig } from "./voice-sip";

type DemoEnv = Record<string, string | undefined>;

const openAiApiKeyEnvVar = "OPENAI_API_KEY";
const sipRoutePath = "/api/demos/openai-agents-sdk-demo/realtime/sip" as const;
const invalidRequestBodyError =
  'Expected a JSON body with a required "callId" string.';

const sipRequestBodySchema = z.object({
  callId: z.string().trim().min(1).max(200),
});

interface OpenAiAgentsSdkDemoSipRequestBody {
  callId: string;
}

export interface OpenAiAgentsSdkDemoSipRouteState {
  openAiApiKeyEnvVar: typeof openAiApiKeyEnvVar;
  routePath: typeof sipRoutePath;
  sdkPrimitive: "OpenAIRealtimeSIP.buildInitialConfig()";
  status: "configured" | "setup-required";
}

interface OpenAiAgentsSdkDemoSipRouteDependencies {
  buildInitialConfig: () => Promise<unknown>;
}

function getRequiredOpenAiApiKey(env: DemoEnv = process.env) {
  const apiKey = env[openAiApiKeyEnvVar];

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. SIP accept-payload generation requires a native OpenAI API key because the downstream realtime call-control lane still depends on it."
    );
  }

  return apiKey;
}

async function readOpenAiAgentsSdkDemoSipBody(request: Request) {
  const bodyText = await request.text();

  if (!bodyText.trim()) {
    throw new Error(invalidRequestBodyError);
  }

  try {
    return sipRequestBodySchema.parse(
      JSON.parse(bodyText)
    ) satisfies OpenAiAgentsSdkDemoSipRequestBody;
  } catch {
    throw new Error(invalidRequestBodyError);
  }
}

export function getOpenAiAgentsSdkDemoSipRouteState(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoSipRouteState {
  return {
    openAiApiKeyEnvVar,
    routePath: sipRoutePath,
    sdkPrimitive: "OpenAIRealtimeSIP.buildInitialConfig()",
    status: env[openAiApiKeyEnvVar] ? "configured" : "setup-required",
  };
}

export async function handleOpenAiAgentsSdkDemoSipRequest(
  request: Request,
  env: DemoEnv = process.env,
  dependencies: OpenAiAgentsSdkDemoSipRouteDependencies = {
    buildInitialConfig: buildOpenAiAgentsSdkDemoSipInitialConfig,
  }
) {
  try {
    getRequiredOpenAiApiKey(env);

    const body = await readOpenAiAgentsSdkDemoSipBody(request);
    const acceptPayload = await dependencies.buildInitialConfig();

    return Response.json({
      acceptPayload,
      callId: body.callId,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build SIP payload.";
    const status = message === invalidRequestBodyError ? 400 : 500;

    return Response.json(
      {
        error: message,
      },
      { status }
    );
  }
}
