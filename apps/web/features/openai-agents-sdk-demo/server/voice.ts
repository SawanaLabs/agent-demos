import { getOpenAiAgentsSdkDemoVoiceClientSecretRouteState } from "./voice-realtime";
import {
  getOpenAiAgentsSdkDemoServerAudioLaneProfile,
  type OpenAiAgentsSdkDemoServerAudioLaneProfile,
} from "./voice-server-audio";
import {
  getOpenAiAgentsSdkDemoServerVoiceSessionProfile,
  type OpenAiAgentsSdkDemoServerVoiceSessionProfile,
} from "./voice-websocket";
import {
  getOpenAiAgentsSdkDemoSipVoiceSessionProfile,
  type OpenAiAgentsSdkDemoSipVoiceSessionProfile,
} from "./voice-sip";
import {
  getOpenAiAgentsSdkDemoTwilioCallControlProfile,
  type OpenAiAgentsSdkDemoTwilioCallControlProfile,
} from "./voice-twilio-route";
import {
  getOpenAiAgentsSdkDemoTwilioMediaStreamBridgeProfile,
  type OpenAiAgentsSdkDemoTwilioMediaStreamBridgeProfile,
} from "./voice-twilio-bridge";
import {
  getOpenAiAgentsSdkDemoTwilioMediaStreamServerProfile,
  type OpenAiAgentsSdkDemoTwilioMediaStreamServerProfile,
} from "./voice-twilio-app";
import {
  getOpenAiAgentsSdkDemoCloudflareWorkerProfile,
  type OpenAiAgentsSdkDemoCloudflareWorkerProfile,
} from "./voice-cloudflare-worker";
import {
  getOpenAiAgentsSdkDemoCloudflareWorkerAppProfile,
  type OpenAiAgentsSdkDemoCloudflareWorkerAppProfile,
} from "./voice-cloudflare-app";
import {
  getOpenAiAgentsSdkDemoCloudflareWorkerModuleProfile,
  type OpenAiAgentsSdkDemoCloudflareWorkerModuleProfile,
} from "./voice-cloudflare-worker-module";
import { getOpenAiAgentsSdkDemoVoiceExtensionProfiles } from "./voice-extensions";
import { getOpenAiAgentsSdkDemoVoiceLaneProfile } from "../voice-lane";

type DemoEnv = Record<string, string | undefined>;

export interface OpenAiAgentsSdkDemoVoiceProfile {
  agentPrimitive: "RealtimeAgent";
  browserTransport: {
    credentialContract: "ephemeral-client-secret";
    routePath: "/api/demos/openai-agents-sdk-demo/realtime/client-secrets";
    sessionModel: "gpt-realtime-2";
    sessionVoice: "marin";
    sdkPrimitive: "RealtimeSession.connect({ apiKey })";
    status: "configured" | "setup-required";
    transport: "WebRTC";
  };
  lane: ReturnType<typeof getOpenAiAgentsSdkDemoVoiceLaneProfile>;
  notes: string;
  cloudflareWorkerApp: OpenAiAgentsSdkDemoCloudflareWorkerAppProfile;
  cloudflareWorkerModule: OpenAiAgentsSdkDemoCloudflareWorkerModuleProfile;
  cloudflareWorkerRuntime: OpenAiAgentsSdkDemoCloudflareWorkerProfile;
  providerExtensions: ReturnType<
    typeof getOpenAiAgentsSdkDemoVoiceExtensionProfiles
  >;
  serverAudioLane: OpenAiAgentsSdkDemoServerAudioLaneProfile;
  sipTransport: OpenAiAgentsSdkDemoSipVoiceSessionProfile;
  serverTransport: OpenAiAgentsSdkDemoServerVoiceSessionProfile & {
    credentialContract: "server-api-key";
    sdkPrimitive:
      "new OpenAIRealtimeWebSocket({ useInsecureApiKey: true }) + RealtimeSession";
  };
  sessionPrimitive: "RealtimeSession";
  sourceGuide: string;
  supportedInsideCurrentWorkspace: true;
  supportedInsideCurrentChatRoute: false;
  twilioCallControl: OpenAiAgentsSdkDemoTwilioCallControlProfile;
  twilioMediaStreamBridge: OpenAiAgentsSdkDemoTwilioMediaStreamBridgeProfile;
  twilioMediaStreamServer: OpenAiAgentsSdkDemoTwilioMediaStreamServerProfile;
}

export function getOpenAiAgentsSdkDemoVoiceProfile(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoVoiceProfile {
  const routeState = getOpenAiAgentsSdkDemoVoiceClientSecretRouteState(env);
  const serverTransportProfile =
    getOpenAiAgentsSdkDemoServerVoiceSessionProfile(env);
  const sipTransportProfile = getOpenAiAgentsSdkDemoSipVoiceSessionProfile(env);

  return {
    agentPrimitive: "RealtimeAgent",
    browserTransport: {
      credentialContract: "ephemeral-client-secret",
      routePath: routeState.routePath,
      sessionModel: routeState.sessionModel,
      sessionVoice: routeState.sessionVoice,
      sdkPrimitive: "RealtimeSession.connect({ apiKey })",
      status: routeState.status,
      transport: "WebRTC",
    },
    lane: getOpenAiAgentsSdkDemoVoiceLaneProfile(),
    notes:
      "Client-secret minting now feeds a dedicated browser voice panel on this page. The realtime lane carries official voice tools, approval events, and handoff state. Separate server-side factories now cover OpenAIRealtimeWebSocket, a raw server audio loop on top of RealtimeSession.sendAudio(), OpenAIRealtimeSIP, TwilioRealtimeTransportLayer, CloudflareRealtimeTransportLayer, a Cloudflare worker runtime wrapper, a Cloudflare worker fetch app, a deployable Cloudflare worker module, a Twilio incoming-call control route, and a deployed-shape Twilio media-stream app factory for custom audio pipelines and provider-specific bridges. The text chat route still stays separate; voice runs through RealtimeSession over WebRTC instead of the AI SDK UI chat stream.",
    cloudflareWorkerApp: getOpenAiAgentsSdkDemoCloudflareWorkerAppProfile(env),
    cloudflareWorkerModule:
      getOpenAiAgentsSdkDemoCloudflareWorkerModuleProfile(env),
    cloudflareWorkerRuntime:
      getOpenAiAgentsSdkDemoCloudflareWorkerProfile(env),
    providerExtensions: getOpenAiAgentsSdkDemoVoiceExtensionProfiles(env),
    serverAudioLane: getOpenAiAgentsSdkDemoServerAudioLaneProfile(env),
    sipTransport: sipTransportProfile,
    serverTransport: {
      ...serverTransportProfile,
      credentialContract: "server-api-key",
      sdkPrimitive:
        "new OpenAIRealtimeWebSocket({ useInsecureApiKey: true }) + RealtimeSession",
    },
    sessionPrimitive: "RealtimeSession",
    sourceGuide:
      "https://openai.github.io/openai-agents-js/guides/voice-agents/",
    supportedInsideCurrentWorkspace: true,
    supportedInsideCurrentChatRoute: false,
    twilioCallControl: getOpenAiAgentsSdkDemoTwilioCallControlProfile(env),
    twilioMediaStreamBridge:
      getOpenAiAgentsSdkDemoTwilioMediaStreamBridgeProfile(env),
    twilioMediaStreamServer:
      getOpenAiAgentsSdkDemoTwilioMediaStreamServerProfile(env),
  };
}
