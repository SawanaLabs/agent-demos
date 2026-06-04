import {
  RealtimeSession,
  type RealtimeSessionConnectOptions,
  type RealtimeTransportLayer,
} from "@openai/agents/realtime";
import {
  CloudflareRealtimeTransportLayer,
  TwilioRealtimeTransportLayer,
} from "@openai/agents-extensions";

import { createOpenAiAgentsSdkDemoVoiceAgentBundle } from "../voice-lane";

type DemoEnv = Record<string, string | undefined>;

const openAiApiKeyEnvVar = "OPENAI_API_KEY" as const;
const defaultVoiceSessionModel = "gpt-realtime-2" as const;
const defaultVoiceSessionVoice = "marin" as const;
const cloudflareWorkflowName =
  "openai-agents-sdk-demo-voice-cloudflare" as const;
const twilioWorkflowName = "openai-agents-sdk-demo-voice-twilio" as const;

export interface OpenAiAgentsSdkDemoVoiceExtensionProfile {
  credentialContract: "server-api-key";
  id: "cloudflare" | "twilio";
  label: "Cloudflare Workers" | "Twilio Media Streams";
  openAiApiKeyEnvVar: typeof openAiApiKeyEnvVar;
  runtimeContract:
    | "bring-your-own-websocket-server"
    | "cloudflare-worker-runtime";
  sdkPrimitive:
    | "CloudflareRealtimeTransportLayer"
    | "TwilioRealtimeTransportLayer";
  sourceGuide: string;
  status: "configured" | "setup-required";
  transport: "WebSocket";
  workflowName: typeof cloudflareWorkflowName | typeof twilioWorkflowName;
}

export interface OpenAiAgentsSdkDemoVoiceExtensionHandle<
  TTransport extends
    | CloudflareRealtimeTransportLayer
    | TwilioRealtimeTransportLayer,
> {
  connectOptions: RealtimeSessionConnectOptions;
  profile: OpenAiAgentsSdkDemoVoiceExtensionProfile;
  session: RealtimeSession;
  transport: TTransport;
}

type TwilioTransportSocket = ConstructorParameters<
  typeof TwilioRealtimeTransportLayer
>[0]["twilioWebSocket"];

function getRequiredOpenAiApiKey(env: DemoEnv = process.env) {
  const apiKey = env[openAiApiKeyEnvVar];

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Provider-specific voice transports require a native OpenAI API key."
    );
  }

  return apiKey;
}

function getVoiceExtensionProfileStatus(env: DemoEnv = process.env) {
  return env[openAiApiKeyEnvVar] ? "configured" : "setup-required";
}

function getOpenAiAgentsSdkDemoCloudflareVoiceExtensionProfile(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoVoiceExtensionProfile {
  return {
    credentialContract: "server-api-key",
    id: "cloudflare",
    label: "Cloudflare Workers",
    openAiApiKeyEnvVar,
    runtimeContract: "cloudflare-worker-runtime",
    sdkPrimitive: "CloudflareRealtimeTransportLayer",
    sourceGuide:
      "https://openai.github.io/openai-agents-js/extensions/cloudflare/",
    status: getVoiceExtensionProfileStatus(env),
    transport: "WebSocket",
    workflowName: cloudflareWorkflowName,
  };
}

function getOpenAiAgentsSdkDemoTwilioVoiceExtensionProfile(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoVoiceExtensionProfile {
  return {
    credentialContract: "server-api-key",
    id: "twilio",
    label: "Twilio Media Streams",
    openAiApiKeyEnvVar,
    runtimeContract: "bring-your-own-websocket-server",
    sdkPrimitive: "TwilioRealtimeTransportLayer",
    sourceGuide: "https://openai.github.io/openai-agents-js/extensions/twilio/",
    status: getVoiceExtensionProfileStatus(env),
    transport: "WebSocket",
    workflowName: twilioWorkflowName,
  };
}

function createOpenAiAgentsSdkDemoVoiceSession({
  transport,
  workflowName,
}: {
  transport: RealtimeTransportLayer;
  workflowName: typeof cloudflareWorkflowName | typeof twilioWorkflowName;
}) {
  const { primaryAgent } = createOpenAiAgentsSdkDemoVoiceAgentBundle();

  return new RealtimeSession(primaryAgent, {
    config: {
      audio: {
        output: {
          voice: defaultVoiceSessionVoice,
        },
      },
    },
    model: defaultVoiceSessionModel,
    transport,
    workflowName,
  });
}

export function getOpenAiAgentsSdkDemoVoiceExtensionProfiles(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoVoiceExtensionProfile[] {
  return [
    getOpenAiAgentsSdkDemoCloudflareVoiceExtensionProfile(env),
    getOpenAiAgentsSdkDemoTwilioVoiceExtensionProfile(env),
  ];
}

export function buildOpenAiAgentsSdkDemoCloudflareVoiceSession(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoVoiceExtensionHandle<CloudflareRealtimeTransportLayer> {
  const apiKey = getRequiredOpenAiApiKey(env);
  const profile = getOpenAiAgentsSdkDemoCloudflareVoiceExtensionProfile(env);
  const transport = new CloudflareRealtimeTransportLayer({
    useInsecureApiKey: true,
  });
  const session = createOpenAiAgentsSdkDemoVoiceSession({
    transport,
    workflowName: cloudflareWorkflowName,
  });

  return {
    connectOptions: {
      apiKey,
      model: defaultVoiceSessionModel,
    },
    profile,
    session,
    transport,
  };
}

export function buildOpenAiAgentsSdkDemoTwilioVoiceSession({
  env = process.env,
  twilioWebSocket,
}: {
  env?: DemoEnv;
  twilioWebSocket: TwilioTransportSocket;
}): OpenAiAgentsSdkDemoVoiceExtensionHandle<TwilioRealtimeTransportLayer> {
  const apiKey = getRequiredOpenAiApiKey(env);
  const profile = getOpenAiAgentsSdkDemoTwilioVoiceExtensionProfile(env);
  const transport = new TwilioRealtimeTransportLayer({
    twilioWebSocket,
    useInsecureApiKey: true,
  });
  const session = createOpenAiAgentsSdkDemoVoiceSession({
    transport,
    workflowName: twilioWorkflowName,
  });

  return {
    connectOptions: {
      apiKey,
      model: defaultVoiceSessionModel,
    },
    profile,
    session,
    transport,
  };
}
