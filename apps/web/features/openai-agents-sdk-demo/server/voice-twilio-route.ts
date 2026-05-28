type DemoEnv = Record<string, string | undefined>;

const openAiApiKeyEnvVar = "OPENAI_API_KEY" as const;
const twilioMediaStreamUrlEnvVar =
  "OPENAI_AGENTS_TWILIO_MEDIA_STREAM_URL" as const;
const twilioIncomingCallRoutePath =
  "/api/demos/openai-agents-sdk-demo/realtime/twilio/incoming-call" as const;

export interface OpenAiAgentsSdkDemoTwilioCallControlProfile {
  mediaStreamUrlEnvVar: typeof twilioMediaStreamUrlEnvVar;
  openAiApiKeyEnvVar: typeof openAiApiKeyEnvVar;
  requiredMediaStreamProtocol: "wss";
  responseContentType: "text/xml; charset=utf-8";
  routePath: typeof twilioIncomingCallRoutePath;
  sdkPrimitive: "TwilioRealtimeTransportLayer";
  sourceGuide: "https://openai.github.io/openai-agents-js/extensions/twilio/";
  status: "configured" | "setup-required";
  transportContract: "Twilio <Connect><Stream>";
}

function getRequiredTwilioMediaStreamUrl(env: DemoEnv = process.env) {
  const mediaStreamUrl = env[twilioMediaStreamUrlEnvVar]?.trim();

  if (!mediaStreamUrl) {
    throw new Error(
      "OPENAI_AGENTS_TWILIO_MEDIA_STREAM_URL is missing. Twilio incoming-call control needs a public wss:// media-stream server that can host TwilioRealtimeTransportLayer."
    );
  }

  const parsedUrl = new URL(mediaStreamUrl);

  if (parsedUrl.protocol !== "wss:") {
    throw new Error(
      "OPENAI_AGENTS_TWILIO_MEDIA_STREAM_URL must use wss:// so Twilio can stream call audio securely."
    );
  }

  return mediaStreamUrl;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("\"", "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function getOpenAiAgentsSdkDemoTwilioCallControlProfile(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoTwilioCallControlProfile {
  return {
    mediaStreamUrlEnvVar: twilioMediaStreamUrlEnvVar,
    openAiApiKeyEnvVar,
    requiredMediaStreamProtocol: "wss",
    responseContentType: "text/xml; charset=utf-8",
    routePath: twilioIncomingCallRoutePath,
    sdkPrimitive: "TwilioRealtimeTransportLayer",
    sourceGuide: "https://openai.github.io/openai-agents-js/extensions/twilio/",
    status:
      env[openAiApiKeyEnvVar] && env[twilioMediaStreamUrlEnvVar]
        ? "configured"
        : "setup-required",
    transportContract: "Twilio <Connect><Stream>",
  };
}

export function buildOpenAiAgentsSdkDemoTwilioIncomingCallTwiml({
  mediaStreamUrl,
}: {
  mediaStreamUrl: string;
}) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Connect><Stream url="${escapeXml(
    mediaStreamUrl
  )}" /></Connect></Response>`;
}

export async function handleOpenAiAgentsSdkDemoTwilioIncomingCallRequest(
  _request: Request,
  env: DemoEnv = process.env
) {
  try {
    const mediaStreamUrl = getRequiredTwilioMediaStreamUrl(env);
    const twiml = buildOpenAiAgentsSdkDemoTwilioIncomingCallTwiml({
      mediaStreamUrl,
    });

    return new Response(twiml, {
      headers: {
        "content-type": "text/xml; charset=utf-8",
      },
      status: 200,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build Twilio TwiML.";

    return new Response(message, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
      status: 500,
    });
  }
}
