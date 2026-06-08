export function formatSandboxError(error: unknown) {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const details = [
    "response" in error &&
    typeof error.response === "object" &&
    error.response &&
    "status" in error.response &&
    typeof error.response.status === "number"
      ? `HTTP ${error.response.status}`
      : null,
    "sandboxName" in error && typeof error.sandboxName === "string"
      ? `sandbox=${error.sandboxName}`
      : null,
    "sessionId" in error && typeof error.sessionId === "string"
      ? `session=${error.sessionId}`
      : null,
    "json" in error && typeof error.json === "object" && error.json
      ? `json=${JSON.stringify(error.json)}`
      : null,
    "text" in error && typeof error.text === "string" && error.text
      ? `text=${error.text}`
      : null,
    error.message ? `message=${error.message}` : null,
  ].filter(Boolean);

  return details.join(" | ") || error.message;
}

export function createSandboxOperationError({
  action,
  error,
  target,
}: {
  action: string;
  error: unknown;
  target: string;
}) {
  return new Error(
    `Sandbox ${action} failed for ${target}. ${formatSandboxError(error)}`
  );
}
