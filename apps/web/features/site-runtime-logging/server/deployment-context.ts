import type { RuntimeDeploymentContext } from "./logger";

export type RuntimeSystemEnvironment = Readonly<
  Record<string, string | undefined>
>;

const environmentPattern = /^[a-z][a-z0-9-]{0,63}$/u;
const referencePattern = /^[A-Za-z0-9._/-]{1,128}$/u;
const hostnamePattern = /^[a-z0-9](?:[a-z0-9.-]{0,251}[a-z0-9])?$/u;

function readDeploymentEnvironment(
  environment: RuntimeSystemEnvironment,
  candidate: string | undefined
): string {
  if (candidate && environmentPattern.test(candidate)) {
    return candidate;
  }

  if (
    candidate === undefined &&
    environment.VERCEL !== "1" &&
    environment.NODE_ENV === "development"
  ) {
    return "development";
  }

  return "unknown";
}

function readHostname(value: string | undefined): string | undefined {
  const rawValue = value?.trim();

  if (!rawValue) {
    return;
  }

  const candidate = rawValue.includes("://") ? rawValue : `https://${rawValue}`;

  if (!URL.canParse(candidate)) {
    return;
  }

  const hostname = new URL(candidate).hostname.toLowerCase();

  return hostnamePattern.test(hostname) ? hostname : undefined;
}

export function deploymentContextFromEnvironment(
  environment: RuntimeSystemEnvironment
): RuntimeDeploymentContext {
  const environmentCandidate = (
    environment.VERCEL_TARGET_ENV ?? environment.VERCEL_ENV
  )?.trim();
  const deploymentEnvironment = readDeploymentEnvironment(
    environment,
    environmentCandidate
  );
  const context: {
    deployment_environment: string;
    deployment_host?: string;
    deployment_ref?: string;
  } = {
    deployment_environment: deploymentEnvironment,
  };
  const deploymentHost = readHostname(environment.VERCEL_URL);
  const deploymentRef = environment.VERCEL_GIT_COMMIT_REF?.trim();

  if (deploymentHost) {
    context.deployment_host = deploymentHost;
  }

  if (deploymentRef && referencePattern.test(deploymentRef)) {
    context.deployment_ref = deploymentRef;
  }

  return context;
}
