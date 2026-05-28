import {
  createOpenAiAgentsSdkDemoCloudflareWorkerRuntime,
  type OpenAiAgentsSdkDemoCloudflareWorkerRuntime,
} from "./voice-cloudflare-worker";

type DemoEnv = Record<string, string | undefined>;

const openAiApiKeyEnvVar = "OPENAI_API_KEY" as const;
const cloudflareWorkflowName =
  "openai-agents-sdk-demo-voice-cloudflare" as const;
const cloudflareRootRoutePath = "/" as const;
const cloudflareConnectRoutePath = "/connect" as const;
const cloudflareHealthcheckMessage =
  "Cloudflare Realtime Worker is running!" as const;

export interface OpenAiAgentsSdkDemoCloudflareWorkerAppProfile {
  connectRoutePath: typeof cloudflareConnectRoutePath;
  healthcheckMessage: typeof cloudflareHealthcheckMessage;
  openAiApiKeyEnvVar: typeof openAiApiKeyEnvVar;
  publicTransportContract: "deployed-worker-fetch-handler";
  rootRoutePath: typeof cloudflareRootRoutePath;
  sdkPrimitive: "CloudflareRealtimeTransportLayer + RealtimeSession";
  serverPrimitive: "export default { fetch(request, env, ctx) }";
  sourceGuide: "https://openai.github.io/openai-agents-js/extensions/cloudflare/";
  status: "configured" | "setup-required";
  websocketUpgradePrimitive: "fetch() + Upgrade: websocket";
  workerCompatibilityFlag: "nodejs_compat";
  workflowName: typeof cloudflareWorkflowName;
}

export interface OpenAiAgentsSdkDemoCloudflareWorkerApp {
  handleRequest: (request: Request) => Promise<Response>;
  profile: OpenAiAgentsSdkDemoCloudflareWorkerAppProfile;
}

interface OpenAiAgentsSdkDemoCloudflareWorkerAppDependencies {
  createRuntime?: (env?: DemoEnv) => OpenAiAgentsSdkDemoCloudflareWorkerRuntime;
}

function buildUpgradeRequiredResponse() {
  return Response.json(
    {
      error:
        "Cloudflare worker connect route requires Upgrade: websocket so the deployed runtime matches the official workerd transport contract.",
    },
    { status: 426 }
  );
}

function isWebSocketUpgrade(request: Request) {
  return request.headers.get("upgrade")?.toLowerCase() === "websocket";
}

export function getOpenAiAgentsSdkDemoCloudflareWorkerAppProfile(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoCloudflareWorkerAppProfile {
  return {
    connectRoutePath: cloudflareConnectRoutePath,
    healthcheckMessage: cloudflareHealthcheckMessage,
    openAiApiKeyEnvVar,
    publicTransportContract: "deployed-worker-fetch-handler",
    rootRoutePath: cloudflareRootRoutePath,
    sdkPrimitive: "CloudflareRealtimeTransportLayer + RealtimeSession",
    serverPrimitive: "export default { fetch(request, env, ctx) }",
    sourceGuide: "https://openai.github.io/openai-agents-js/extensions/cloudflare/",
    status: env[openAiApiKeyEnvVar] ? "configured" : "setup-required",
    websocketUpgradePrimitive: "fetch() + Upgrade: websocket",
    workerCompatibilityFlag: "nodejs_compat",
    workflowName: cloudflareWorkflowName,
  };
}

export function createOpenAiAgentsSdkDemoCloudflareWorkerApp(
  env: DemoEnv = process.env,
  dependencies: OpenAiAgentsSdkDemoCloudflareWorkerAppDependencies = {}
): OpenAiAgentsSdkDemoCloudflareWorkerApp {
  const createRuntime =
    dependencies.createRuntime ??
    ((environment: DemoEnv) =>
      createOpenAiAgentsSdkDemoCloudflareWorkerRuntime(environment));

  return {
    handleRequest: async (request) => {
      const pathname = new URL(request.url).pathname;

      if (pathname === cloudflareRootRoutePath) {
        return Response.json({
          message: cloudflareHealthcheckMessage,
        });
      }

      if (pathname !== cloudflareConnectRoutePath) {
        return new Response("Not Found", { status: 404 });
      }

      if (!isWebSocketUpgrade(request)) {
        return buildUpgradeRequiredResponse();
      }

      const runtime = createRuntime(env);

      await runtime.connect();

      try {
        return Response.json({
          state: runtime.getState(),
          transportName: runtime.transportName,
          workflowName: runtime.profile.workflowName,
        });
      } finally {
        runtime.close();
      }
    },
    profile: getOpenAiAgentsSdkDemoCloudflareWorkerAppProfile(env),
  };
}
