import type { RealtimeSession } from "@openai/agents/realtime";

import {
  buildOpenAiAgentsSdkDemoCloudflareVoiceSession,
  type OpenAiAgentsSdkDemoVoiceExtensionHandle,
} from "./voice-extensions";

type DemoEnv = Record<string, string | undefined>;

const openAiApiKeyEnvVar = "OPENAI_API_KEY" as const;
const cloudflareWorkflowName =
  "openai-agents-sdk-demo-voice-cloudflare" as const;

type CloudflareSessionLike = Pick<RealtimeSession, "close" | "connect">;

export interface OpenAiAgentsSdkDemoCloudflareWorkerProfile {
  connectPrimitive: "RealtimeSession.connect({ apiKey, model })";
  openAiApiKeyEnvVar: typeof openAiApiKeyEnvVar;
  openEventBehavior: "skipOpenEventListeners: true";
  runtimeEntryPoint: "Cloudflare Worker fetch()";
  sdkPrimitive: "CloudflareRealtimeTransportLayer + RealtimeSession";
  sourceGuide: "https://openai.github.io/openai-agents-js/extensions/cloudflare/";
  status: "configured" | "setup-required";
  transport: "WebSocket";
  websocketUpgradePrimitive: "fetch() + Upgrade: websocket";
  workerCompatibilityFlag: "nodejs_compat";
  workflowName: typeof cloudflareWorkflowName;
}

export interface OpenAiAgentsSdkDemoCloudflareWorkerState {
  closeCount: number;
  connectCount: number;
  isConnected: boolean;
}

export interface OpenAiAgentsSdkDemoCloudflareWorkerRuntime {
  close: () => void;
  connect: () => Promise<void>;
  getState: () => OpenAiAgentsSdkDemoCloudflareWorkerState;
  profile: OpenAiAgentsSdkDemoCloudflareWorkerProfile;
  session: CloudflareSessionLike;
  transportName: string;
}

interface OpenAiAgentsSdkDemoCloudflareWorkerDependencies {
  buildSessionHandle?: (env?: DemoEnv) =>
    | OpenAiAgentsSdkDemoVoiceExtensionHandle<any>
    | {
        connectOptions: {
          apiKey: string;
          model: string;
        };
        profile: {
          status: "configured" | "setup-required";
        };
        session: CloudflareSessionLike;
        transport: {
          constructor: {
            name: string;
          };
        };
      };
}

export function getOpenAiAgentsSdkDemoCloudflareWorkerProfile(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoCloudflareWorkerProfile {
  return {
    connectPrimitive: "RealtimeSession.connect({ apiKey, model })",
    openAiApiKeyEnvVar,
    openEventBehavior: "skipOpenEventListeners: true",
    runtimeEntryPoint: "Cloudflare Worker fetch()",
    sdkPrimitive: "CloudflareRealtimeTransportLayer + RealtimeSession",
    sourceGuide: "https://openai.github.io/openai-agents-js/extensions/cloudflare/",
    status: env[openAiApiKeyEnvVar] ? "configured" : "setup-required",
    transport: "WebSocket",
    websocketUpgradePrimitive: "fetch() + Upgrade: websocket",
    workerCompatibilityFlag: "nodejs_compat",
    workflowName: cloudflareWorkflowName,
  };
}

export function createOpenAiAgentsSdkDemoCloudflareWorkerRuntime(
  env: DemoEnv = process.env,
  dependencies: OpenAiAgentsSdkDemoCloudflareWorkerDependencies = {}
): OpenAiAgentsSdkDemoCloudflareWorkerRuntime {
  const buildSessionHandle =
    dependencies.buildSessionHandle ??
    buildOpenAiAgentsSdkDemoCloudflareVoiceSession;
  const handle = buildSessionHandle(env);
  const state: OpenAiAgentsSdkDemoCloudflareWorkerState = {
    closeCount: 0,
    connectCount: 0,
    isConnected: false,
  };

  return {
    close: () => {
      state.closeCount += 1;
      state.isConnected = false;
      handle.session.close();
    },
    connect: async () => {
      await handle.session.connect(handle.connectOptions);
      state.connectCount += 1;
      state.isConnected = true;
    },
    getState: () => ({
      ...state,
    }),
    profile: getOpenAiAgentsSdkDemoCloudflareWorkerProfile(env),
    session: handle.session,
    transportName: handle.transport.constructor.name,
  };
}
