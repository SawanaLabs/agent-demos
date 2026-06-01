import { createGateway } from "ai";

export const DEFAULT_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v3/ai";
export const MINIMUM_NODE_VERSION = "22.13.0";
const nodeVersionPattern =
  /^v?(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:[-+].*)?$/;

export type AiGatewayEnvRecord = Record<string, string | undefined>;

export interface ParsedNodeVersion {
  major: number;
  minor: number;
  patch: number;
}

export interface AiGatewayContractConfig {
  apiKey: string;
  baseURL: string;
  chatModel: string;
}

export interface AiGatewayResolvedEnv {
  apiKey: string | undefined;
  baseURL: string;
  chatModel: string;
}

export interface AiGatewaySetupConfig {
  baseURL: string;
  chatModel: string;
}

export interface AiGatewayContractSetupState<
  TConfig extends AiGatewaySetupConfig = AiGatewaySetupConfig,
> {
  config: TConfig;
  isReady: boolean;
  issues: string[];
  nodeVersion: string;
}

export interface AiGatewayContractOptions<
  TConfig extends AiGatewaySetupConfig = AiGatewaySetupConfig,
> {
  buildConfig?: (
    resolvedEnv: AiGatewayResolvedEnv,
    env: AiGatewayEnvRecord
  ) => TConfig;
  defaultBaseURL?: string;
  defaultChatModel: string;
  getAdditionalIssues?: (
    resolvedEnv: AiGatewayResolvedEnv,
    env: AiGatewayEnvRecord
  ) => string[];
  missingApiKeyError: string;
  missingApiKeyIssue?: string;
}

const genericMissingApiKeyIssue =
  "AI_GATEWAY_API_KEY is missing. The demo can render, but chat requests will fail until it is configured.";

export function parseNodeVersion(version: string): ParsedNodeVersion {
  const match = nodeVersionPattern.exec(version);
  const major = Number(match?.groups?.major);
  const minor = Number(match?.groups?.minor);
  const patch = Number(match?.groups?.patch);

  if (![major, minor, patch].every(Number.isInteger)) {
    throw new Error(`Unable to parse Node.js version: "${version}".`);
  }

  return { major, minor, patch };
}

export function getNodeMajor(version: string): number {
  return parseNodeVersion(version).major;
}

function compareNodeVersions(
  left: ParsedNodeVersion,
  right: ParsedNodeVersion
): number {
  if (left.major !== right.major) {
    return left.major - right.major;
  }

  if (left.minor !== right.minor) {
    return left.minor - right.minor;
  }

  return left.patch - right.patch;
}

export function assertSupportedNodeRuntime(version = process.version): number {
  const parsedVersion = parseNodeVersion(version);
  const minimumVersion = parseNodeVersion(MINIMUM_NODE_VERSION);

  if (compareNodeVersions(parsedVersion, minimumVersion) < 0) {
    throw new Error(
      `Node.js ${version} is unsupported. This demo workspace requires Node.js >=${MINIMUM_NODE_VERSION}.`
    );
  }

  return parsedVersion.major;
}

export function resolveAiGatewayContractEnv(
  env: AiGatewayEnvRecord,
  options: Pick<AiGatewayContractOptions, "defaultBaseURL" | "defaultChatModel">
): AiGatewayResolvedEnv {
  return {
    apiKey: env.AI_GATEWAY_API_KEY,
    baseURL:
      env.AI_GATEWAY_BASE_URL ||
      options.defaultBaseURL ||
      DEFAULT_GATEWAY_BASE_URL,
    chatModel: env.AI_GATEWAY_CHAT_MODEL || options.defaultChatModel,
  };
}

export function readAiGatewayContractConfig(
  env: AiGatewayEnvRecord,
  options: AiGatewayContractOptions
): AiGatewayContractConfig {
  assertSupportedNodeRuntime();
  const resolvedEnv = resolveAiGatewayContractEnv(env, options);

  if (!resolvedEnv.apiKey) {
    throw new Error(options.missingApiKeyError);
  }

  return {
    apiKey: resolvedEnv.apiKey,
    baseURL: resolvedEnv.baseURL,
    chatModel: resolvedEnv.chatModel,
  };
}

export function buildAiGatewayContractSetupState<
  TConfig extends AiGatewaySetupConfig,
>(
  env: AiGatewayEnvRecord,
  options: AiGatewayContractOptions<TConfig>
): AiGatewayContractSetupState<TConfig> {
  const issues: string[] = [];
  const resolvedEnv = resolveAiGatewayContractEnv(env, options);

  try {
    assertSupportedNodeRuntime();
  } catch (error) {
    issues.push(
      error instanceof Error ? error.message : "Unsupported Node.js runtime."
    );
  }

  if (!resolvedEnv.apiKey) {
    issues.push(options.missingApiKeyIssue || genericMissingApiKeyIssue);
  }

  issues.push(...(options.getAdditionalIssues?.(resolvedEnv, env) ?? []));

  return {
    config:
      options.buildConfig?.(resolvedEnv, env) ??
      ({
        baseURL: resolvedEnv.baseURL,
        chatModel: resolvedEnv.chatModel,
      } as TConfig),
    isReady: issues.length === 0,
    issues,
    nodeVersion: process.version,
  };
}

export function createAiGatewayFromContract(
  env: AiGatewayEnvRecord,
  options: AiGatewayContractOptions
): ReturnType<typeof createGateway> {
  const { apiKey, baseURL } = readAiGatewayContractConfig(env, options);

  return createGateway({
    apiKey,
    baseURL,
  });
}
