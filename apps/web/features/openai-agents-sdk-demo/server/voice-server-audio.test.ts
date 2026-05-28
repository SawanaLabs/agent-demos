import { describe, expect, it } from "vitest";

import {
  buildOpenAiAgentsSdkDemoServerAudioLane,
  getOpenAiAgentsSdkDemoServerAudioLaneProfile,
} from "./voice-server-audio";

describe("openai agents sdk demo server audio lane", () => {
  it("exposes the official server audio loop contract", () => {
    expect(getOpenAiAgentsSdkDemoServerAudioLaneProfile()).toEqual({
      inputPrimitive: "RealtimeSession.sendAudio()",
      interruptPrimitive: "RealtimeSession.interrupt()",
      model: "gpt-realtime-2",
      openAiApiKeyEnvVar: "OPENAI_API_KEY",
      outputAudioEvent: "session.on('audio')",
      outputTranscriptEvent: "session.on('transport_event')",
      requestResponsePrimitive: "session.transport.requestResponse()",
      sessionVoice: "marin",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/guides/voice-agents/transport/",
      status: "setup-required",
      transport: "WebSocket",
      workflowName: "openai-agents-sdk-demo-voice-websocket",
    });
  });

  it("forwards server audio actions and buffers output events", async () => {
    const events = new Map<string, Set<(...args: any[]) => void>>();
    const audioChunk = new Uint8Array([1, 2, 3]).buffer;
    const connectCalls: unknown[] = [];
    const sendAudioCalls: unknown[] = [];
    const muteCalls: boolean[] = [];
    const requestResponseCalls: unknown[] = [];
    let interruptCount = 0;
    let closeCount = 0;

    const lane = buildOpenAiAgentsSdkDemoServerAudioLane(
      {
        OPENAI_API_KEY: "openai-key",
      },
      {
        buildSessionHandle: () =>
          ({
            connectOptions: {
              apiKey: "openai-key",
              model: "gpt-realtime-2",
            },
            profile: {
              model: "gpt-realtime-2",
              openAiApiKeyEnvVar: "OPENAI_API_KEY",
              rawEventAccess: "session.transport.sendEvent()",
              sdkPrimitives: [
                "OpenAIRealtimeWebSocket",
                "RealtimeSession",
                "RealtimeSession.connect({ apiKey })",
              ],
              sessionVoice: "marin",
              status: "configured",
              transport: "WebSocket",
              useInsecureApiKey: true,
              workflowName: "openai-agents-sdk-demo-voice-websocket",
            },
            session: {
              close: () => {
                closeCount += 1;
              },
              connect: async (options: unknown) => {
                connectCalls.push(options);
              },
              interrupt: () => {
                interruptCount += 1;
              },
              mute: (muted: boolean) => {
                muteCalls.push(muted);
              },
              on: (event: string, listener: (...args: any[]) => void) => {
                const bucket = events.get(event) ?? new Set();

                bucket.add(listener);
                events.set(event, bucket);
              },
              sendAudio: (
                audio: ArrayBuffer,
                options?: {
                  commit?: boolean;
                }
              ) => {
                sendAudioCalls.push({
                  audio,
                  options: options ?? null,
                });
              },
              transport: {
                requestResponse: (response?: Record<string, unknown>) => {
                  requestResponseCalls.push(response ?? null);
                },
              },
            },
          }) as any,
      }
    );

    await lane.connect();
    lane.sendAudio(audioChunk, { commit: true });
    lane.requestResponse({ metadata: "server-audio-lane" });
    lane.mute(true);
    lane.interrupt();

    events
      .get("audio")
      ?.forEach((listener) =>
        listener({ data: audioChunk, responseId: "resp_123", type: "audio" })
      );
    events
      .get("transport_event")
      ?.forEach((listener) =>
        listener({
          transcript: "Tesla",
          type: "conversation.item.input_audio_transcription.completed",
        })
      );
    events.get("audio_start")?.forEach((listener) => listener());
    events.get("audio_stopped")?.forEach((listener) => listener());
    events.get("audio_interrupted")?.forEach((listener) => listener());

    expect(connectCalls).toEqual([
      {
        apiKey: "openai-key",
        model: "gpt-realtime-2",
      },
    ]);
    expect(sendAudioCalls).toEqual([
      {
        audio: audioChunk,
        options: {
          commit: true,
        },
      },
    ]);
    expect(requestResponseCalls).toEqual([
      {
        metadata: "server-audio-lane",
      },
    ]);
    expect(muteCalls).toEqual([true]);
    expect(interruptCount).toBe(1);
    expect(lane.takeOutputAudio()).toEqual([
      {
        data: audioChunk,
        responseId: "resp_123",
        type: "audio",
      },
    ]);
    expect(lane.takeTransportEvents()).toEqual([
      {
        transcript: "Tesla",
        type: "conversation.item.input_audio_transcription.completed",
      },
    ]);
    expect(lane.getState()).toEqual({
      interruptionCount: 1,
      isOutputActive: false,
      outputAudioChunkCount: 1,
      transportEventCount: 1,
    });

    lane.close();

    expect(closeCount).toBe(1);
  });
});
