import type {
  RealtimeSession,
  RealtimeSessionConnectOptions,
  TransportEvent,
  TransportLayerAudio,
} from "@openai/agents/realtime";

import {
  buildOpenAiAgentsSdkDemoServerVoiceSession,
  type OpenAiAgentsSdkDemoServerVoiceSessionHandle,
} from "./voice-websocket";

type DemoEnv = Record<string, string | undefined>;

type VoiceSessionLike = Pick<
  RealtimeSession,
  "close" | "connect" | "interrupt" | "mute" | "on" | "sendAudio" | "transport"
>;

const openAiApiKeyEnvVar = "OPENAI_API_KEY" as const;
const defaultVoiceSessionModel = "gpt-realtime-2" as const;
const defaultVoiceSessionVoice = "marin" as const;
const defaultVoiceWorkflowName =
  "openai-agents-sdk-demo-voice-websocket" as const;

export interface OpenAiAgentsSdkDemoServerAudioLaneProfile {
  inputPrimitive: "RealtimeSession.sendAudio()";
  interruptPrimitive: "RealtimeSession.interrupt()";
  model: typeof defaultVoiceSessionModel;
  openAiApiKeyEnvVar: typeof openAiApiKeyEnvVar;
  outputAudioEvent: "session.on('audio')";
  outputTranscriptEvent: "session.on('transport_event')";
  requestResponsePrimitive: "session.transport.requestResponse()";
  sessionVoice: typeof defaultVoiceSessionVoice;
  sourceGuide: "https://openai.github.io/openai-agents-js/guides/voice-agents/transport/";
  status: "configured" | "setup-required";
  transport: "WebSocket";
  workflowName: typeof defaultVoiceWorkflowName;
}

export interface OpenAiAgentsSdkDemoServerAudioLaneState {
  interruptionCount: number;
  isOutputActive: boolean;
  outputAudioChunkCount: number;
  transportEventCount: number;
}

export interface OpenAiAgentsSdkDemoServerAudioLane {
  close: () => void;
  connect: () => Promise<void>;
  getState: () => OpenAiAgentsSdkDemoServerAudioLaneState;
  interrupt: () => void;
  mute: (muted: boolean) => void;
  profile: OpenAiAgentsSdkDemoServerAudioLaneProfile;
  requestResponse: (response?: Record<string, unknown>) => void;
  sendAudio: (audio: ArrayBuffer, options?: { commit?: boolean }) => void;
  session: VoiceSessionLike;
  takeOutputAudio: () => TransportLayerAudio[];
  takeTransportEvents: () => TransportEvent[];
}

interface OpenAiAgentsSdkDemoServerAudioLaneDependencies {
  buildSessionHandle?: (
    env: DemoEnv
  ) => OpenAiAgentsSdkDemoServerVoiceSessionHandle | {
    connectOptions: RealtimeSessionConnectOptions;
    profile: OpenAiAgentsSdkDemoServerVoiceSessionHandle["profile"];
    session: VoiceSessionLike;
  };
}

function cloneAudioEvent(event: TransportLayerAudio): TransportLayerAudio {
  return {
    data: event.data.slice(0),
    responseId: event.responseId,
    type: event.type,
  };
}

export function getOpenAiAgentsSdkDemoServerAudioLaneProfile(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoServerAudioLaneProfile {
  return {
    inputPrimitive: "RealtimeSession.sendAudio()",
    interruptPrimitive: "RealtimeSession.interrupt()",
    model: defaultVoiceSessionModel,
    openAiApiKeyEnvVar,
    outputAudioEvent: "session.on('audio')",
    outputTranscriptEvent: "session.on('transport_event')",
    requestResponsePrimitive: "session.transport.requestResponse()",
    sessionVoice: defaultVoiceSessionVoice,
    sourceGuide:
      "https://openai.github.io/openai-agents-js/guides/voice-agents/transport/",
    status: env[openAiApiKeyEnvVar] ? "configured" : "setup-required",
    transport: "WebSocket",
    workflowName: defaultVoiceWorkflowName,
  };
}

export function buildOpenAiAgentsSdkDemoServerAudioLane(
  env: DemoEnv = process.env,
  dependencies: OpenAiAgentsSdkDemoServerAudioLaneDependencies = {}
): OpenAiAgentsSdkDemoServerAudioLane {
  const buildSessionHandle =
    dependencies.buildSessionHandle ?? buildOpenAiAgentsSdkDemoServerVoiceSession;
  const handle = buildSessionHandle(env);
  const outputAudio: TransportLayerAudio[] = [];
  const transportEvents: TransportEvent[] = [];
  const state: OpenAiAgentsSdkDemoServerAudioLaneState = {
    interruptionCount: 0,
    isOutputActive: false,
    outputAudioChunkCount: 0,
    transportEventCount: 0,
  };

  handle.session.on("audio", (event: TransportLayerAudio) => {
    outputAudio.push(cloneAudioEvent(event));
    state.outputAudioChunkCount += 1;
  });
  handle.session.on("transport_event", (event: TransportEvent) => {
    transportEvents.push(event);
    state.transportEventCount += 1;
  });
  handle.session.on("audio_start", () => {
    state.isOutputActive = true;
  });
  handle.session.on("audio_stopped", () => {
    state.isOutputActive = false;
  });
  handle.session.on("audio_interrupted", () => {
    state.interruptionCount += 1;
    state.isOutputActive = false;
  });

  return {
    close: () => {
      handle.session.close();
    },
    connect: async () => {
      await handle.session.connect(handle.connectOptions);
    },
    getState: () => ({
      ...state,
    }),
    interrupt: () => {
      handle.session.interrupt();
    },
    mute: (muted: boolean) => {
      handle.session.mute(muted);
    },
    profile: getOpenAiAgentsSdkDemoServerAudioLaneProfile(env),
    requestResponse: (response) => {
      const requestResponse = handle.session.transport.requestResponse;

      if (typeof requestResponse !== "function") {
        throw new Error(
          "The current realtime transport does not expose requestResponse()."
        );
      }

      requestResponse(response);
    },
    sendAudio: (audio, options) => {
      handle.session.sendAudio(audio, options);
    },
    session: handle.session,
    takeOutputAudio: () => outputAudio.splice(0, outputAudio.length),
    takeTransportEvents: () =>
      transportEvents.splice(0, transportEvents.length),
  };
}
