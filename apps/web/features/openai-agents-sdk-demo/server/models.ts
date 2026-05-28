type DemoEnv = Record<string, string | undefined>;

export type DemoReasoningEffort =
  | "high"
  | "low"
  | "medium"
  | "minimal"
  | "none"
  | "xhigh";

export type DemoTextVerbosity = "high" | "low" | "medium";

export interface OpenAiAgentsSdkDemoModelProfile {
  api: "responses";
  baseUrl: string;
  model: string;
  provider: "gateway-openai-client";
  reasoningEffort: DemoReasoningEffort;
  responsesTransport: "http";
  textVerbosity: DemoTextVerbosity;
}

const defaultGatewayBaseUrl = "https://ai-gateway.vercel.sh/v1";
const defaultGatewayChatModel = "openai/gpt-5-mini";
const defaultReasoningEffort: DemoReasoningEffort = "medium";
const defaultTextVerbosity: DemoTextVerbosity = "low";
const reasoningEfforts = new Set<DemoReasoningEffort>([
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
]);
const textVerbosityLevels = new Set<DemoTextVerbosity>([
  "low",
  "medium",
  "high",
]);

export function getOpenAiAgentsSdkDemoChatModel(env: DemoEnv) {
  return (
    env.OPENAI_AGENTS_MODEL ||
    env.AI_GATEWAY_CHAT_MODEL ||
    defaultGatewayChatModel
  );
}

export function getOpenAiAgentsSdkDemoGatewayBaseUrl(env: DemoEnv) {
  return env.OPENAI_AGENTS_GATEWAY_BASE_URL || defaultGatewayBaseUrl;
}

export function getOpenAiAgentsSdkDemoReasoningEffort(
  env: DemoEnv
): DemoReasoningEffort {
  const configuredEffort = env.OPENAI_AGENTS_REASONING_EFFORT;

  if (
    configuredEffort &&
    reasoningEfforts.has(configuredEffort as DemoReasoningEffort)
  ) {
    return configuredEffort as DemoReasoningEffort;
  }

  return defaultReasoningEffort;
}

export function getOpenAiAgentsSdkDemoTextVerbosity(
  env: DemoEnv
): DemoTextVerbosity {
  const configuredVerbosity = env.OPENAI_AGENTS_TEXT_VERBOSITY;

  if (
    configuredVerbosity &&
    textVerbosityLevels.has(configuredVerbosity as DemoTextVerbosity)
  ) {
    return configuredVerbosity as DemoTextVerbosity;
  }

  return defaultTextVerbosity;
}

export function getOpenAiAgentsSdkDemoModelProfile(
  env: DemoEnv
): OpenAiAgentsSdkDemoModelProfile {
  return {
    api: "responses",
    baseUrl: getOpenAiAgentsSdkDemoGatewayBaseUrl(env),
    model: getOpenAiAgentsSdkDemoChatModel(env),
    provider: "gateway-openai-client",
    reasoningEffort: getOpenAiAgentsSdkDemoReasoningEffort(env),
    responsesTransport: "http",
    textVerbosity: getOpenAiAgentsSdkDemoTextVerbosity(env),
  };
}

export function isOpenAiAgentsSdkDemoImageGenerationProviderBlocked(
  modelProfile: Pick<
    OpenAiAgentsSdkDemoModelProfile,
    "api" | "baseUrl" | "provider"
  >
) {
  return (
    modelProfile.api === "responses" &&
    modelProfile.provider === "gateway-openai-client" &&
    modelProfile.baseUrl.includes("ai-gateway.vercel.sh")
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function getOpenAiAgentsSdkDemoProviderErrorMessage(error: unknown) {
  const message = getErrorMessage(error);

  if (/At least one user message is required in the input/i.test(message)) {
    return [
      "AI Gateway rejected the OpenAI Agents SDK function-tool continuation request.",
      "The SDK default toolUseBehavior is run_llm_again, so after a local tool() call succeeds, the run sends that tool output back to the model for the final answer.",
      `Provider response: ${message}`,
      "No fake final answer was injected for this demo.",
    ].join(" ");
  }

  if (/No tool output found for function call/i.test(message)) {
    return [
      "AI Gateway rejected the OpenAI Agents SDK tool-output continuation request.",
      "The provider reported a missing function-call output while the SDK was continuing the official run loop.",
      `Provider response: ${message}`,
      "No fake tool output was injected for this demo.",
    ].join(" ");
  }

  return null;
}

export function supportsOpenAiAgentsSdkToolSearch(model: string) {
  const normalizedModel = model.toLowerCase();

  if (!normalizedModel.startsWith("openai/gpt-5")) {
    return false;
  }

  if (
    normalizedModel.startsWith("openai/gpt-5.4") ||
    normalizedModel.startsWith("openai/gpt-5.5")
  ) {
    return true;
  }

  return false;
}
