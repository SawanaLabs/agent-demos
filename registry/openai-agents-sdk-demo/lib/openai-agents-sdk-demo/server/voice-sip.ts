import {
  OpenAIRealtimeSIP,
  RealtimeSession,
  type RealtimeSessionConnectOptions,
} from "@openai/agents/realtime";

import { createOpenAiAgentsSdkDemoVoiceAgentBundle } from "../voice-lane";

type DemoEnv = Record<string, string | undefined>;

const openAiApiKeyEnvVar = "OPENAI_API_KEY" as const;
const defaultVoiceSessionModel = "gpt-realtime-2" as const;
const defaultVoiceSessionVoice = "marin" as const;
const defaultSipWorkflowName = "openai-agents-sdk-demo-voice-sip" as const;

export interface OpenAiAgentsSdkDemoSipVoiceSessionProfile {
  callControlContract: "provider-or-openai-call-accept-route";
  connectPrimitive: "RealtimeSession.connect({ apiKey, callId })";
  initialConfigPrimitive: "OpenAIRealtimeSIP.buildInitialConfig()";
  model: typeof defaultVoiceSessionModel;
  openAiApiKeyEnvVar: typeof openAiApiKeyEnvVar;
  routePath: "/api/demos/openai-agents-sdk-demo/realtime/sip";
  sessionVoice: typeof defaultVoiceSessionVoice;
  sourceGuide: "https://openai.github.io/openai-agents-js/guides/voice-agents/transport/";
  status: "configured" | "setup-required";
  transport: "SIP";
  workflowName: typeof defaultSipWorkflowName;
}

export interface OpenAiAgentsSdkDemoSipVoiceSessionHandle {
  connectOptions: RealtimeSessionConnectOptions;
  profile: OpenAiAgentsSdkDemoSipVoiceSessionProfile;
  session: RealtimeSession;
  transport: OpenAIRealtimeSIP;
}

function getRequiredOpenAiApiKey(env: DemoEnv = process.env) {
  const apiKey = env[openAiApiKeyEnvVar];

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. SIP voice transport requires a native OpenAI API key."
    );
  }

  return apiKey;
}

function getRequiredCallId(callId: string) {
  if (callId.trim().length === 0) {
    throw new Error(
      "OpenAIRealtimeSIP requires a non-empty callId from an existing SIP-initiated Realtime call."
    );
  }

  return callId;
}

export function getOpenAiAgentsSdkDemoSipVoiceSessionProfile(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoSipVoiceSessionProfile {
  return {
    callControlContract: "provider-or-openai-call-accept-route",
    connectPrimitive: "RealtimeSession.connect({ apiKey, callId })",
    initialConfigPrimitive: "OpenAIRealtimeSIP.buildInitialConfig()",
    model: defaultVoiceSessionModel,
    openAiApiKeyEnvVar,
    routePath: "/api/demos/openai-agents-sdk-demo/realtime/sip",
    sessionVoice: defaultVoiceSessionVoice,
    sourceGuide:
      "https://openai.github.io/openai-agents-js/guides/voice-agents/transport/",
    status: env[openAiApiKeyEnvVar] ? "configured" : "setup-required",
    transport: "SIP",
    workflowName: defaultSipWorkflowName,
  };
}

export async function buildOpenAiAgentsSdkDemoSipInitialConfig() {
  const { primaryAgent } = createOpenAiAgentsSdkDemoVoiceAgentBundle();

  return await OpenAIRealtimeSIP.buildInitialConfig(primaryAgent, {
    model: defaultVoiceSessionModel,
    config: {
      audio: {
        output: {
          voice: defaultVoiceSessionVoice,
        },
      },
    },
    workflowName: defaultSipWorkflowName,
  });
}

export function buildOpenAiAgentsSdkDemoSipVoiceSession({
  callId,
  env = process.env,
}: {
  callId: string;
  env?: DemoEnv;
}): OpenAiAgentsSdkDemoSipVoiceSessionHandle {
  const profile = getOpenAiAgentsSdkDemoSipVoiceSessionProfile(env);
  const apiKey = getRequiredOpenAiApiKey(env);
  const { primaryAgent } = createOpenAiAgentsSdkDemoVoiceAgentBundle();
  const transport = new OpenAIRealtimeSIP({
    useInsecureApiKey: true,
  });
  const session = new RealtimeSession(primaryAgent, {
    config: {
      audio: {
        output: {
          voice: defaultVoiceSessionVoice,
        },
      },
    },
    model: defaultVoiceSessionModel,
    transport,
    workflowName: defaultSipWorkflowName,
  });

  return {
    connectOptions: {
      apiKey,
      callId: getRequiredCallId(callId),
      model: defaultVoiceSessionModel,
    },
    profile,
    session,
    transport,
  };
}
