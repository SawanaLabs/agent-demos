import {
  getSharedSandboxAgentSessionRegistry,
  SANDBOX_AGENT_PREVIEW_PORT,
} from "@/features/sandbox-agent/server/session";

export const runtime = "nodejs";

const PREVIEW_ERROR_CODE_RE = /^[A-Z0-9_]+$/;
const PREVIEW_STATUS_BODY_LIMIT_BYTES = 1024;
const PREVIEW_STATUS_TIMEOUT_MS = 3000;

function readPreviewErrorCode(response: Response, body: string) {
  const headerCode = response.headers.get("x-vercel-error");

  if (headerCode) {
    return headerCode;
  }

  const bodyCode = body
    .split("\n")
    .map((line) => line.trim())
    .find((line) => PREVIEW_ERROR_CODE_RE.test(line));

  return bodyCode ?? null;
}

function trimBody(body: string) {
  const trimmed = body.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 280);
}

async function readLimitedBody(response: Response) {
  const reader = response.body?.getReader();

  if (!reader) {
    return null;
  }

  const decoder = new TextDecoder();
  let body = "";
  let remainingBytes = PREVIEW_STATUS_BODY_LIMIT_BYTES;
  let shouldCancel = false;

  try {
    while (remainingBytes > 0) {
      const chunk = await reader.read();

      if (chunk.done) {
        break;
      }

      const value = chunk.value;
      const limitedValue =
        value.byteLength > remainingBytes
          ? value.slice(0, remainingBytes)
          : value;

      body += decoder.decode(limitedValue, { stream: true });
      remainingBytes -= limitedValue.byteLength;

      if (limitedValue.byteLength < value.byteLength || remainingBytes === 0) {
        shouldCancel = true;
        break;
      }
    }
  } finally {
    if (shouldCancel) {
      await reader.cancel().catch(() => undefined);
    }
  }

  body += decoder.decode();

  return trimBody(body);
}

function previewStatusResponse(
  payload: {
    errorCode: string | null;
    message: string | null;
    ok: boolean;
    status: number | null;
    statusText: string | null;
  },
  init?: ResponseInit
) {
  return Response.json(payload, init);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId")?.trim();
  const url = searchParams.get("url");

  if (!sessionId) {
    return previewStatusResponse(
      {
        errorCode: "MISSING_SESSION_ID",
        message: "A sandbox session id is required.",
        ok: false,
        status: null,
        statusText: null,
      },
      { status: 400 }
    );
  }

  if (!url) {
    return previewStatusResponse(
      {
        errorCode: "MISSING_URL",
        message: "A preview URL is required.",
        ok: false,
        status: null,
        statusText: null,
      },
      { status: 400 }
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return previewStatusResponse(
      {
        errorCode: "INVALID_URL",
        message: "The preview URL is not a valid absolute URL.",
        ok: false,
        status: null,
        statusText: null,
      },
      { status: 400 }
    );
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return previewStatusResponse(
      {
        errorCode: "INVALID_PROTOCOL",
        message: "The preview URL must use http or https.",
        ok: false,
        status: null,
        statusText: null,
      },
      { status: 400 }
    );
  }

  let expectedOrigin: string;

  try {
    const registry = getSharedSandboxAgentSessionRegistry();
    expectedOrigin = new URL(
      registry.getDomain(sessionId, SANDBOX_AGENT_PREVIEW_PORT)
    ).origin;
  } catch {
    return previewStatusResponse(
      {
        errorCode: "PREVIEW_SESSION_NOT_FOUND",
        message: "The sandbox preview session is not available.",
        ok: false,
        status: null,
        statusText: null,
      },
      { status: 404 }
    );
  }

  if (parsedUrl.origin !== expectedOrigin) {
    return previewStatusResponse(
      {
        errorCode: "PREVIEW_URL_NOT_ALLOWED",
        message: "The preview URL does not belong to this sandbox session.",
        ok: false,
        status: null,
        statusText: null,
      },
      { status: 403 }
    );
  }

  try {
    const response = await fetch(parsedUrl, {
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(PREVIEW_STATUS_TIMEOUT_MS),
    });
    const body = await readLimitedBody(response);

    return previewStatusResponse({
      errorCode: response.ok
        ? null
        : readPreviewErrorCode(response, body ?? ""),
      message: response.ok ? null : body,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText || null,
    });
  } catch (error) {
    return previewStatusResponse({
      errorCode: "FETCH_FAILED",
      message:
        error instanceof Error ? error.message : "Failed to check preview URL.",
      ok: false,
      status: null,
      statusText: null,
    });
  }
}
