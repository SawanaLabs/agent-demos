import type { RealtimeSession } from "@openai/agents/realtime";

import {
  buildOpenAiAgentsSdkDemoTwilioVoiceSession,
  type OpenAiAgentsSdkDemoVoiceExtensionHandle,
} from "./voice-extensions";

type DemoEnv = Record<string, string | undefined>;

const openAiApiKeyEnvVar = "OPENAI_API_KEY" as const;
const twilioWorkflowName = "openai-agents-sdk-demo-voice-twilio" as const;

type TwilioSocket = Parameters<
  typeof buildOpenAiAgentsSdkDemoTwilioVoiceSession
>[0]["twilioWebSocket"];

type TwilioSessionLike = Pick<RealtimeSession, "close" | "connect">;

export interface OpenAiAgentsSdkDemoTwilioMediaStreamBridgeProfile {
  closeBehavior: "session.close() on websocket close";
  connectPrimitive: "RealtimeSession.connect({ apiKey, model })";
  hostingContract: "external-websocket-server";
  openAiApiKeyEnvVar: typeof openAiApiKeyEnvVar;
  sdkPrimitive: "TwilioRealtimeTransportLayer + RealtimeSession";
  sourceGuide: "https://openai.github.io/openai-agents-js/extensions/twilio/";
  status: "configured" | "setup-required";
  transport: "WebSocket";
  workflowName: typeof twilioWorkflowName;
}

export interface OpenAiAgentsSdkDemoTwilioMediaStreamBridgeState {
  closeEventCount: number;
  errorEventCount: number;
  isConnected: boolean;
}

export interface OpenAiAgentsSdkDemoTwilioMediaStreamBridge {
  close: () => void;
  connect: () => Promise<void>;
  getState: () => OpenAiAgentsSdkDemoTwilioMediaStreamBridgeState;
  profile: OpenAiAgentsSdkDemoTwilioMediaStreamBridgeProfile;
  session: TwilioSessionLike;
  transportName: string;
}

interface OpenAiAgentsSdkDemoTwilioMediaStreamBridgeDependencies {
  buildSessionHandle?: (options: {
    env?: DemoEnv;
    twilioWebSocket: TwilioSocket;
  }) =>
    | OpenAiAgentsSdkDemoVoiceExtensionHandle<any>
    | {
        connectOptions: {
          apiKey: string;
          model: string;
        };
        profile: {
          status: "configured" | "setup-required";
        };
        session: TwilioSessionLike;
        transport: {
          constructor: {
            name: string;
          };
        };
      };
}

export function getOpenAiAgentsSdkDemoTwilioMediaStreamBridgeProfile(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoTwilioMediaStreamBridgeProfile {
  return {
    closeBehavior: "session.close() on websocket close",
    connectPrimitive: "RealtimeSession.connect({ apiKey, model })",
    hostingContract: "external-websocket-server",
    openAiApiKeyEnvVar,
    sdkPrimitive: "TwilioRealtimeTransportLayer + RealtimeSession",
    sourceGuide: "https://openai.github.io/openai-agents-js/extensions/twilio/",
    status: env[openAiApiKeyEnvVar] ? "configured" : "setup-required",
    transport: "WebSocket",
    workflowName: twilioWorkflowName,
  };
}

export function createOpenAiAgentsSdkDemoTwilioMediaStreamBridge(
  env: DemoEnv,
  dependencies: OpenAiAgentsSdkDemoTwilioMediaStreamBridgeDependencies,
  twilioWebSocket: TwilioSocket
): OpenAiAgentsSdkDemoTwilioMediaStreamBridge {
  const buildSessionHandle =
    dependencies.buildSessionHandle ??
    buildOpenAiAgentsSdkDemoTwilioVoiceSession;
  const handle = buildSessionHandle({
    env,
    twilioWebSocket,
  });
  const state: OpenAiAgentsSdkDemoTwilioMediaStreamBridgeState = {
    closeEventCount: 0,
    errorEventCount: 0,
    isConnected: false,
  };

  twilioWebSocket.addEventListener("close", () => {
    state.closeEventCount += 1;
    state.isConnected = false;
    handle.session.close();
  });
  twilioWebSocket.addEventListener("error", () => {
    state.errorEventCount += 1;
  });

  return {
    close: () => {
      state.isConnected = false;
      handle.session.close();
    },
    connect: async () => {
      await handle.session.connect(handle.connectOptions);
      state.isConnected = true;
    },
    getState: () => ({
      ...state,
    }),
    profile: getOpenAiAgentsSdkDemoTwilioMediaStreamBridgeProfile(env),
    session: handle.session,
    transportName: handle.transport.constructor.name,
  };
}
