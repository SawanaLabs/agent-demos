import { describe, expect, it } from "vitest";

import { getOpenAiAgentsSdkDemoRuntimeState } from "./runtime";
import { getOpenAiAgentsSdkDemoVoiceProfile } from "./voice";

const voiceClientSecretRoutePath =
  "/api/demos/openai-agents-sdk-demo/realtime/client-secrets";

describe("openai agents sdk demo Voice Agents guide", () => {
  it("exposes the official realtime voice primitives and the browser client-secret route contract", () => {
    expect(getOpenAiAgentsSdkDemoVoiceProfile()).toEqual({
      agentPrimitive: "RealtimeAgent",
      browserTransport: {
        credentialContract: "ephemeral-client-secret",
        routePath: voiceClientSecretRoutePath,
        sessionModel: "gpt-realtime-2",
        sessionVoice: "marin",
        sdkPrimitive: "RealtimeSession.connect({ apiKey })",
        status: "setup-required",
        transport: "WebRTC",
      },
      lane: {
        approvalToolNames: ["publish_research_summary"],
        emittedSessionEvents: [
          "history_updated",
          "transport_event",
          "agent_start",
          "agent_end",
          "agent_handoff",
          "agent_tool_start",
          "agent_tool_end",
          "tool_approval_requested",
          "guardrail_tripped",
          "mcp_tools_changed",
          "audio_start",
          "audio_stopped",
          "audio_interrupted",
          "error",
        ],
        handoffAgentNames: ["Voice Risk Reviewer"],
        recommendedSmokePrompts: [
          "为特斯拉生成一个简短的投研 brief。",
          "请挑战一下特斯拉多头观点，把任务交给风险 reviewer。",
          "给我一段准备对外发布的特斯拉研究摘要，并准备发布。",
        ],
        toolNames: ["build_research_brief", "publish_research_summary"],
        transportEscapeHatch: "session.transport.sendEvent()",
      },
      notes:
        "Client-secret minting now feeds a dedicated browser voice panel on this page. The realtime lane carries official voice tools, approval events, and handoff state. Separate server-side factories now cover OpenAIRealtimeWebSocket, a raw server audio loop on top of RealtimeSession.sendAudio(), OpenAIRealtimeSIP, TwilioRealtimeTransportLayer, CloudflareRealtimeTransportLayer, a Cloudflare worker runtime wrapper, a Cloudflare worker fetch app, a deployable Cloudflare worker module, a Twilio incoming-call control route, and a deployed-shape Twilio media-stream app factory for custom audio pipelines and provider-specific bridges. The text chat route still stays separate; voice runs through RealtimeSession over WebRTC instead of the AI SDK UI chat stream.",
      cloudflareWorkerApp: {
        connectRoutePath: "/connect",
        healthcheckMessage: "Cloudflare Realtime Worker is running!",
        openAiApiKeyEnvVar: "OPENAI_API_KEY",
        publicTransportContract: "deployed-worker-fetch-handler",
        rootRoutePath: "/",
        sdkPrimitive: "CloudflareRealtimeTransportLayer + RealtimeSession",
        serverPrimitive: "export default { fetch(request, env, ctx) }",
        sourceGuide:
          "https://openai.github.io/openai-agents-js/extensions/cloudflare/",
        status: "setup-required",
        websocketUpgradePrimitive: "fetch() + Upgrade: websocket",
        workerCompatibilityFlag: "nodejs_compat",
        workflowName: "openai-agents-sdk-demo-voice-cloudflare",
      },
      cloudflareWorkerModule: {
        modulePrimitive: "export default { fetch(request, env, ctx) }",
        openAiApiKeyEnvVar: "OPENAI_API_KEY",
        runtimeContract: "cloudflare-worker-module",
        sdkPrimitive: "CloudflareRealtimeTransportLayer + RealtimeSession",
        sourceGuide:
          "https://openai.github.io/openai-agents-js/extensions/cloudflare/",
        status: "setup-required",
        workflowName: "openai-agents-sdk-demo-voice-cloudflare",
      },
      cloudflareWorkerRuntime: {
        connectPrimitive: "RealtimeSession.connect({ apiKey, model })",
        openAiApiKeyEnvVar: "OPENAI_API_KEY",
        openEventBehavior: "skipOpenEventListeners: true",
        runtimeEntryPoint: "Cloudflare Worker fetch()",
        sdkPrimitive: "CloudflareRealtimeTransportLayer + RealtimeSession",
        sourceGuide:
          "https://openai.github.io/openai-agents-js/extensions/cloudflare/",
        status: "setup-required",
        transport: "WebSocket",
        websocketUpgradePrimitive: "fetch() + Upgrade: websocket",
        workerCompatibilityFlag: "nodejs_compat",
        workflowName: "openai-agents-sdk-demo-voice-cloudflare",
      },
      providerExtensions: [
        {
          credentialContract: "server-api-key",
          id: "cloudflare",
          label: "Cloudflare Workers",
          openAiApiKeyEnvVar: "OPENAI_API_KEY",
          runtimeContract: "cloudflare-worker-runtime",
          sdkPrimitive: "CloudflareRealtimeTransportLayer",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/extensions/cloudflare/",
          status: "setup-required",
          transport: "WebSocket",
          workflowName: "openai-agents-sdk-demo-voice-cloudflare",
        },
        {
          credentialContract: "server-api-key",
          id: "twilio",
          label: "Twilio Media Streams",
          openAiApiKeyEnvVar: "OPENAI_API_KEY",
          runtimeContract: "bring-your-own-websocket-server",
          sdkPrimitive: "TwilioRealtimeTransportLayer",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/extensions/twilio/",
          status: "setup-required",
          transport: "WebSocket",
          workflowName: "openai-agents-sdk-demo-voice-twilio",
        },
      ],
      sipTransport: {
        callControlContract: "provider-or-openai-call-accept-route",
        connectPrimitive: "RealtimeSession.connect({ apiKey, callId })",
        initialConfigPrimitive: "OpenAIRealtimeSIP.buildInitialConfig()",
        model: "gpt-realtime-2",
        openAiApiKeyEnvVar: "OPENAI_API_KEY",
        routePath: "/api/demos/openai-agents-sdk-demo/realtime/sip",
        sessionVoice: "marin",
        sourceGuide:
          "https://openai.github.io/openai-agents-js/guides/voice-agents/transport/",
        status: "setup-required",
        transport: "SIP",
        workflowName: "openai-agents-sdk-demo-voice-sip",
      },
      serverTransport: {
        credentialContract: "server-api-key",
        model: "gpt-realtime-2",
        openAiApiKeyEnvVar: "OPENAI_API_KEY",
        rawEventAccess: "session.transport.sendEvent()",
        sdkPrimitive:
          "new OpenAIRealtimeWebSocket({ useInsecureApiKey: true }) + RealtimeSession",
        sdkPrimitives: [
          "OpenAIRealtimeWebSocket",
          "RealtimeSession",
          "RealtimeSession.connect({ apiKey })",
        ],
        sessionVoice: "marin",
        status: "setup-required",
        transport: "WebSocket",
        useInsecureApiKey: true,
        workflowName: "openai-agents-sdk-demo-voice-websocket",
      },
      serverAudioLane: {
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
      },
      twilioCallControl: {
        mediaStreamUrlEnvVar: "OPENAI_AGENTS_TWILIO_MEDIA_STREAM_URL",
        openAiApiKeyEnvVar: "OPENAI_API_KEY",
        requiredMediaStreamProtocol: "wss",
        responseContentType: "text/xml; charset=utf-8",
        routePath:
          "/api/demos/openai-agents-sdk-demo/realtime/twilio/incoming-call",
        sdkPrimitive: "TwilioRealtimeTransportLayer",
        sourceGuide:
          "https://openai.github.io/openai-agents-js/extensions/twilio/",
        status: "setup-required",
        transportContract: "Twilio <Connect><Stream>",
      },
      twilioMediaStreamBridge: {
        closeBehavior: "session.close() on websocket close",
        connectPrimitive: "RealtimeSession.connect({ apiKey, model })",
        hostingContract: "external-websocket-server",
        openAiApiKeyEnvVar: "OPENAI_API_KEY",
        sdkPrimitive: "TwilioRealtimeTransportLayer + RealtimeSession",
        sourceGuide:
          "https://openai.github.io/openai-agents-js/extensions/twilio/",
        status: "setup-required",
        transport: "WebSocket",
        workflowName: "openai-agents-sdk-demo-voice-twilio",
      },
      twilioMediaStreamServer: {
        healthcheckMessage: "Twilio Media Stream Server is running!",
        incomingCallRoutePath: "/incoming-call",
        mediaStreamRoutePath: "/media-stream",
        openAiApiKeyEnvVar: "OPENAI_API_KEY",
        publicTransportContract: "public-https-host + websocket-server",
        rootRoutePath: "/",
        sdkPrimitive: "TwilioRealtimeTransportLayer + RealtimeSession",
        serverPrimitive: "Fastify + @fastify/websocket",
        sourceGuide:
          "https://openai.github.io/openai-agents-js/extensions/twilio/",
        status: "setup-required",
        twimlTransport: "Twilio <Connect><Stream>",
        websocketProtocol: "wss",
        workflowName: "openai-agents-sdk-demo-voice-twilio",
      },
      sessionPrimitive: "RealtimeSession",
      sourceGuide:
        "https://openai.github.io/openai-agents-js/guides/voice-agents/",
      supportedInsideCurrentWorkspace: true,
      supportedInsideCurrentChatRoute: false,
    });
  });

  it("marks the Voice Agents guide implemented once the browser voice UI exists", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
      })
    ).toMatchObject({
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "blocked",
          implementationStatus: "implemented",
          label: "Voice Agents",
          observable:
            "RealtimeSession.connect({ apiKey }) over WebRTC plus visible browser microphone controls",
          providerCapabilityStatus: "setup-required",
          sdkPrimitive: "RealtimeAgent / RealtimeSession",
          sourceGuide:
            "https://openai.github.io/openai-agents-js/guides/voice-agents/",
        }),
      ]),
      voiceProfile: expect.objectContaining({
        agentPrimitive: "RealtimeAgent",
        browserTransport: expect.objectContaining({
          routePath: voiceClientSecretRoutePath,
          status: "setup-required",
        }),
        sessionPrimitive: "RealtimeSession",
        supportedInsideCurrentWorkspace: true,
        supportedInsideCurrentChatRoute: false,
      }),
    });
  });

  it("marks the voice provider path available when a native OpenAI key exists", () => {
    expect(
      getOpenAiAgentsSdkDemoRuntimeState({
        AI_GATEWAY_API_KEY: "gateway-key",
        OPENAI_API_KEY: "openai-key",
      })
    ).toMatchObject({
      guideCoverage: expect.arrayContaining([
        expect.objectContaining({
          currentRunStatus: "ready",
          implementationStatus: "implemented",
          label: "Voice Agents",
          providerCapabilityStatus: "available",
        }),
      ]),
      voiceProfile: expect.objectContaining({
        browserTransport: expect.objectContaining({
          status: "configured",
        }),
        serverAudioLane: expect.objectContaining({
          status: "configured",
        }),
        cloudflareWorkerRuntime: expect.objectContaining({
          status: "configured",
        }),
        cloudflareWorkerApp: expect.objectContaining({
          status: "configured",
        }),
        cloudflareWorkerModule: expect.objectContaining({
          status: "configured",
        }),
        serverTransport: expect.objectContaining({
          status: "configured",
        }),
        twilioCallControl: expect.objectContaining({
          status: "setup-required",
        }),
        twilioMediaStreamBridge: expect.objectContaining({
          status: "configured",
        }),
        twilioMediaStreamServer: expect.objectContaining({
          status: "configured",
        }),
      }),
    });
  });
});
