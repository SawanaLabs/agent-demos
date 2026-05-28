import {
  buildOpenAiAgentsSdkDemoTwilioIncomingCallTwiml,
  getOpenAiAgentsSdkDemoTwilioCallControlProfile,
} from "./voice-twilio-route";
import {
  createOpenAiAgentsSdkDemoTwilioMediaStreamBridge,
  type OpenAiAgentsSdkDemoTwilioMediaStreamBridge,
} from "./voice-twilio-bridge";

type DemoEnv = Record<string, string | undefined>;

const openAiApiKeyEnvVar = "OPENAI_API_KEY" as const;
const twilioWorkflowName = "openai-agents-sdk-demo-voice-twilio" as const;
const twilioRootRoutePath = "/" as const;
const twilioIncomingCallRoutePath = "/incoming-call" as const;
const twilioMediaStreamRoutePath = "/media-stream" as const;
const twilioHealthcheckMessage =
  "Twilio Media Stream Server is running!" as const;

type TwilioSocket = Parameters<
  typeof createOpenAiAgentsSdkDemoTwilioMediaStreamBridge
>[2];

export interface OpenAiAgentsSdkDemoTwilioMediaStreamServerProfile {
  healthcheckMessage: typeof twilioHealthcheckMessage;
  incomingCallRoutePath: typeof twilioIncomingCallRoutePath;
  mediaStreamRoutePath: typeof twilioMediaStreamRoutePath;
  openAiApiKeyEnvVar: typeof openAiApiKeyEnvVar;
  publicTransportContract: "public-https-host + websocket-server";
  rootRoutePath: typeof twilioRootRoutePath;
  sdkPrimitive: "TwilioRealtimeTransportLayer + RealtimeSession";
  serverPrimitive: "Fastify + @fastify/websocket";
  sourceGuide: "https://openai.github.io/openai-agents-js/extensions/twilio/";
  status: "configured" | "setup-required";
  twimlTransport: "Twilio <Connect><Stream>";
  websocketProtocol: "wss";
  workflowName: typeof twilioWorkflowName;
}

export interface OpenAiAgentsSdkDemoTwilioMediaStreamServer {
  connectMediaStream: (
    websocket: TwilioSocket
  ) => Promise<OpenAiAgentsSdkDemoTwilioMediaStreamBridge>;
  createHealthResponse: () => Response;
  handleIncomingCallRequest: (request: Request) => Promise<Response>;
  profile: OpenAiAgentsSdkDemoTwilioMediaStreamServerProfile;
}

interface OpenAiAgentsSdkDemoTwilioMediaStreamServerDependencies {
  createBridge?: (
    env: DemoEnv,
    websocket: TwilioSocket
  ) => OpenAiAgentsSdkDemoTwilioMediaStreamBridge;
}

function getRequiredPublicHost(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();

  if (host) {
    return host;
  }

  const url = new URL(request.url);

  if (!url.host) {
    throw new Error(
      "Twilio media-stream app could not determine a public host for the websocket endpoint."
    );
  }

  return url.host;
}

function buildOpenAiAgentsSdkDemoTwilioMediaStreamUrl(request: Request) {
  return `wss://${getRequiredPublicHost(request)}${twilioMediaStreamRoutePath}`;
}

export function getOpenAiAgentsSdkDemoTwilioMediaStreamServerProfile(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoTwilioMediaStreamServerProfile {
  return {
    healthcheckMessage: twilioHealthcheckMessage,
    incomingCallRoutePath: twilioIncomingCallRoutePath,
    mediaStreamRoutePath: twilioMediaStreamRoutePath,
    openAiApiKeyEnvVar,
    publicTransportContract: "public-https-host + websocket-server",
    rootRoutePath: twilioRootRoutePath,
    sdkPrimitive: "TwilioRealtimeTransportLayer + RealtimeSession",
    serverPrimitive: "Fastify + @fastify/websocket",
    sourceGuide: "https://openai.github.io/openai-agents-js/extensions/twilio/",
    status: env[openAiApiKeyEnvVar] ? "configured" : "setup-required",
    twimlTransport: "Twilio <Connect><Stream>",
    websocketProtocol: "wss",
    workflowName: twilioWorkflowName,
  };
}

export function createOpenAiAgentsSdkDemoTwilioMediaStreamServer(
  env: DemoEnv = process.env,
  dependencies: OpenAiAgentsSdkDemoTwilioMediaStreamServerDependencies = {}
): OpenAiAgentsSdkDemoTwilioMediaStreamServer {
  const createBridge =
    dependencies.createBridge ??
    ((environment: DemoEnv, websocket: TwilioSocket) =>
      createOpenAiAgentsSdkDemoTwilioMediaStreamBridge(
        environment,
        {},
        websocket
      ));

  return {
    connectMediaStream: async (websocket) => {
      const bridge = createBridge(env, websocket);

      await bridge.connect();

      return bridge;
    },
    createHealthResponse: () =>
      Response.json({
        message: twilioHealthcheckMessage,
      }),
    handleIncomingCallRequest: async (request) => {
      const mediaStreamUrl =
        buildOpenAiAgentsSdkDemoTwilioMediaStreamUrl(request);
      const twiml = buildOpenAiAgentsSdkDemoTwilioIncomingCallTwiml({
        mediaStreamUrl,
      });

      return new Response(twiml, {
        headers: {
          "content-type":
            getOpenAiAgentsSdkDemoTwilioCallControlProfile(env)
              .responseContentType,
        },
        status: 200,
      });
    },
    profile: getOpenAiAgentsSdkDemoTwilioMediaStreamServerProfile(env),
  };
}
