import { APICallError, RetryError } from "ai";

// Preserve diagnostic messages, without serializing request headers, bodies or credentials.
export function nodeFailureDetails(
  error: unknown,
  depth = 0
): NodeFailureDetails {
  const value =
    error && typeof error === "object"
      ? (error as Record<string, unknown>)
      : undefined;
  const cause = RetryError.isInstance(error)
    ? error.lastError
    : (value?.cause ?? value?.error);
  const api = APICallError.isInstance(error) ? error : undefined;
  const code = value?.code;
  return {
    name: typeof value?.name === "string" ? value.name : "Error",
    message: redactCredentials(
      typeof value?.message === "string" ? value.message : String(error)
    ),
    ...(typeof code === "string" ? { code } : {}),
    ...(api ? { statusCode: api.statusCode, retryable: api.isRetryable } : {}),
    ...(cause && depth < 4
      ? { cause: nodeFailureDetails(cause, depth + 1) }
      : {}),
  };
}

interface NodeFailureDetails {
  cause?: NodeFailureDetails;
  code?: string;
  message: string;
  name: string;
  retryable?: boolean;
  statusCode?: number;
}

function redactCredentials(message: string) {
  return message
    .replace(
      /\b(postgres(?:ql)?|https?):\/\/[^\s/@]+:[^\s/@]+@/gi,
      "$1://[redacted]@"
    )
    .replace(/\bBearer\s+[^\s,;"']+/gi, "Bearer [redacted]")
    .replace(/\bsk-[\w-]+/g, "[redacted]")
    .replace(
      /((?:api[_-]?key|token|password|secret)\s*[=:]\s*)[^\s&,;"']+/gi,
      "$1[redacted]"
    );
}
