import {
  OpenAIRealtimeWebSocket,
  RealtimeSession,
  type RealtimeSessionConnectOptions,
} from "@openai/agents/realtime";

import { createOpenAiAgentsSdkDemoVoiceAgentBundle } from "../voice-lane";

type DemoEnv = Record<string, string | undefined>;

const openAiApiKeyEnvVar = "OPENAI_API_KEY" as const;
const defaultVoiceSessionModel = "gpt-realtime-2" as const;
const defaultVoiceSessionVoice = "marin" as const;
const defaultVoiceWorkflowName =
  "openai-agents-sdk-demo-voice-websocket" as const;

export interface OpenAiAgentsSdkDemoServerVoiceSessionProfile {
  model: typeof defaultVoiceSessionModel;
  openAiApiKeyEnvVar: typeof openAiApiKeyEnvVar;
  rawEventAccess: "session.transport.sendEvent()";
  sdkPrimitives: [
    "OpenAIRealtimeWebSocket",
    "RealtimeSession",
    "RealtimeSession.connect({ apiKey })",
  ];
  sessionVoice: typeof defaultVoiceSessionVoice;
  status: "configured" | "setup-required";
  transport: "WebSocket";
  useInsecureApiKey: true;
  workflowName: typeof defaultVoiceWorkflowName;
}

export interface OpenAiAgentsSdkDemoServerVoiceSessionHandle {
  connectOptions: RealtimeSessionConnectOptions;
  profile: OpenAiAgentsSdkDemoServerVoiceSessionProfile;
  session: RealtimeSession;
}

function getRequiredOpenAiApiKey(env: DemoEnv = process.env) {
  const apiKey = env[openAiApiKeyEnvVar];

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Server-side Realtime WebSocket transport requires a native OpenAI API key."
    );
  }

  return apiKey;
}

export function getOpenAiAgentsSdkDemoServerVoiceSessionProfile(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoServerVoiceSessionProfile {
  return {
    model: defaultVoiceSessionModel,
    openAiApiKeyEnvVar,
    rawEventAccess: "session.transport.sendEvent()",
    sdkPrimitives: [
      "OpenAIRealtimeWebSocket",
      "RealtimeSession",
      "RealtimeSession.connect({ apiKey })",
    ],
    sessionVoice: defaultVoiceSessionVoice,
    status: env[openAiApiKeyEnvVar] ? "configured" : "setup-required",
    transport: "WebSocket",
    useInsecureApiKey: true,
    workflowName: defaultVoiceWorkflowName,
  };
}

export function buildOpenAiAgentsSdkDemoServerVoiceSession(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoServerVoiceSessionHandle {
  const profile = getOpenAiAgentsSdkDemoServerVoiceSessionProfile(env);
  const apiKey = getRequiredOpenAiApiKey(env);
  const { primaryAgent } = createOpenAiAgentsSdkDemoVoiceAgentBundle();
  const transport = new OpenAIRealtimeWebSocket({
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
    workflowName: defaultVoiceWorkflowName,
  });

  return {
    connectOptions: {
      apiKey,
      model: defaultVoiceSessionModel,
    },
    profile,
    session,
  };
}
