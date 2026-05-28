import { describe, expect, it } from "vitest";

import {
  getOpenAiAgentsSdkDemoTwilioCallControlProfile,
  handleOpenAiAgentsSdkDemoTwilioIncomingCallRequest,
} from "./voice-twilio-route";

describe("openai agents sdk demo twilio call-control route", () => {
  it("exposes the official Twilio incoming-call contract", () => {
    expect(getOpenAiAgentsSdkDemoTwilioCallControlProfile()).toEqual({
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
    });
  });

  it("fails early when the external media-stream websocket url is missing", async () => {
    const response = await handleOpenAiAgentsSdkDemoTwilioIncomingCallRequest(
      new Request(
        "http://localhost:3000/api/demos/openai-agents-sdk-demo/realtime/twilio/incoming-call"
      ),
      {
        OPENAI_API_KEY: "openai-key",
      }
    );

    expect(response.status).toBe(500);
    await expect(response.text()).resolves.toContain(
      "OPENAI_AGENTS_TWILIO_MEDIA_STREAM_URL is missing."
    );
  });

  it("returns TwiML that connects the call to the configured media stream", async () => {
    const response = await handleOpenAiAgentsSdkDemoTwilioIncomingCallRequest(
      new Request(
        "http://localhost:3000/api/demos/openai-agents-sdk-demo/realtime/twilio/incoming-call"
      ),
      {
        OPENAI_AGENTS_TWILIO_MEDIA_STREAM_URL:
          "wss://voice.example.com/media-stream",
        OPENAI_API_KEY: "openai-key",
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe(
      "text/xml; charset=utf-8"
    );
    await expect(response.text()).resolves.toContain(
      '<Connect><Stream url="wss://voice.example.com/media-stream" /></Connect>'
    );
  });
});
