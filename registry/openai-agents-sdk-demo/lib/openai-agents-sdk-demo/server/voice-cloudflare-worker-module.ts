import {
  createOpenAiAgentsSdkDemoCloudflareWorkerApp,
  type OpenAiAgentsSdkDemoCloudflareWorkerApp,
} from "./voice-cloudflare-app";

type DemoEnv = Record<string, string | undefined>;

const openAiApiKeyEnvVar = "OPENAI_API_KEY" as const;
const cloudflareWorkflowName =
  "openai-agents-sdk-demo-voice-cloudflare" as const;

export interface OpenAiAgentsSdkDemoCloudflareWorkerModuleProfile {
  modulePrimitive: "export default { fetch(request, env, ctx) }";
  openAiApiKeyEnvVar: typeof openAiApiKeyEnvVar;
  runtimeContract: "cloudflare-worker-module";
  sdkPrimitive: "CloudflareRealtimeTransportLayer + RealtimeSession";
  sourceGuide: "https://openai.github.io/openai-agents-js/extensions/cloudflare/";
  status: "configured" | "setup-required";
  workflowName: typeof cloudflareWorkflowName;
}

export interface OpenAiAgentsSdkDemoCloudflareWorkerModule {
  fetch: (
    request: Request,
    env: DemoEnv,
    ctx: {
      waitUntil?: (promise: Promise<unknown>) => void;
    }
  ) => Promise<Response>;
  profile: OpenAiAgentsSdkDemoCloudflareWorkerModuleProfile;
}

interface OpenAiAgentsSdkDemoCloudflareWorkerModuleDependencies {
  createApp?: (env?: DemoEnv) => OpenAiAgentsSdkDemoCloudflareWorkerApp;
}

export function getOpenAiAgentsSdkDemoCloudflareWorkerModuleProfile(
  env: DemoEnv = process.env
): OpenAiAgentsSdkDemoCloudflareWorkerModuleProfile {
  return {
    modulePrimitive: "export default { fetch(request, env, ctx) }",
    openAiApiKeyEnvVar,
    runtimeContract: "cloudflare-worker-module",
    sdkPrimitive: "CloudflareRealtimeTransportLayer + RealtimeSession",
    sourceGuide:
      "https://openai.github.io/openai-agents-js/extensions/cloudflare/",
    status: env[openAiApiKeyEnvVar] ? "configured" : "setup-required",
    workflowName: cloudflareWorkflowName,
  };
}

export function createOpenAiAgentsSdkDemoCloudflareWorkerModule(
  defaultEnv: DemoEnv = process.env,
  dependencies: OpenAiAgentsSdkDemoCloudflareWorkerModuleDependencies = {}
): OpenAiAgentsSdkDemoCloudflareWorkerModule {
  const createApp =
    dependencies.createApp ??
    ((env: DemoEnv) => createOpenAiAgentsSdkDemoCloudflareWorkerApp(env));

  return {
    fetch: async (request, env) => {
      const app = createApp({
        ...defaultEnv,
        ...env,
      });

      return app.handleRequest(request);
    },
    profile: getOpenAiAgentsSdkDemoCloudflareWorkerModuleProfile(defaultEnv),
  };
}
