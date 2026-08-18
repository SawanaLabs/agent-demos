import { z } from "zod";
import { runtimeErrorEvents } from "@/features/site-runtime-logging/server/events";
import { runtimeErrorLogger } from "@/features/site-runtime-logging/server/server-logger";

const clientErrorReportSchema = z
  .object({
    kind: z.enum([
      "global_error",
      "route_error",
      "unhandled_rejection",
      "window_error",
    ]),
    source: z.enum(["app-error-boundary", "app-global-error-boundary"]),
  })
  .strict();

const maximumClientErrorReportBytes = 512;
const contentLengthPattern = /^\d+$/u;
const clientAddressPattern = /^[\d.:a-f]+$/iu;
const reportBudgetWindowMilliseconds = 60_000;
const maximumReportsPerClientWindow = 5;
const maximumReportsPerProcessWindow = 100;

let reportBudgetWindowStartedAt = Date.now();
let reportsInProcessWindow = 0;
const reportsByClient = new Map<string, number>();

const runtimeSource = {
  "app-error-boundary": "app_error_boundary",
  "app-global-error-boundary": "app_global_error_boundary",
} as const;

export async function POST(request: Request) {
  if (!isSameOriginBrowserRequest(request)) {
    return invalidReportResponse(403);
  }

  if (!isJsonRequest(request)) {
    return invalidReportResponse(415);
  }

  const bodyResult = await readBoundedJson(request);

  if (!bodyResult.ok) {
    return invalidReportResponse(bodyResult.tooLarge ? 413 : 400);
  }

  const parsedBody = clientErrorReportSchema.safeParse(bodyResult.value);

  if (!parsedBody.success) {
    return invalidReportResponse(400);
  }

  if (!consumeClientErrorReportBudget(request)) {
    return invalidReportResponse(429);
  }

  runtimeErrorLogger.error(runtimeErrorEvents.clientRuntimeFailed, {
    client_error_kind: parsedBody.data.kind,
    failure_category: "runtime",
    operation: "client_render",
    source: runtimeSource[parsedBody.data.source],
  });

  return new Response(null, { status: 204 });
}

function invalidReportResponse(status: 400 | 403 | 413 | 415 | 429) {
  const headers = status === 429 ? { "retry-after": "60" } : undefined;

  return Response.json(
    {
      error: "Invalid client error report.",
      ok: false,
    },
    { headers, status }
  );
}

function consumeClientErrorReportBudget(request: Request): boolean {
  const now = Date.now();

  if (now - reportBudgetWindowStartedAt >= reportBudgetWindowMilliseconds) {
    reportBudgetWindowStartedAt = now;
    reportsInProcessWindow = 0;
    reportsByClient.clear();
  }

  const clientKey = readClientKey(request);
  const clientReports = reportsByClient.get(clientKey) ?? 0;

  if (
    reportsInProcessWindow >= maximumReportsPerProcessWindow ||
    clientReports >= maximumReportsPerClientWindow
  ) {
    return false;
  }

  reportsInProcessWindow += 1;
  reportsByClient.set(clientKey, clientReports + 1);
  return true;
}

function readClientKey(request: Request): string {
  const forwardedAddress =
    request.headers.get("x-vercel-forwarded-for") ??
    request.headers.get("x-forwarded-for");
  const clientAddress = forwardedAddress?.split(",", 1)[0]?.trim();

  if (
    !clientAddress ||
    clientAddress.length > 64 ||
    !clientAddressPattern.test(clientAddress)
  ) {
    return "unknown";
  }

  return clientAddress;
}

function isJsonRequest(request: Request): boolean {
  return (
    request.headers
      .get("content-type")
      ?.split(";", 1)[0]
      ?.trim()
      .toLowerCase() === "application/json"
  );
}

function isSameOriginBrowserRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  return origin === new URL(request.url).origin && fetchSite === "same-origin";
}

async function readBoundedJson(
  request: Request
): Promise<
  | { readonly ok: false; readonly tooLarge: boolean }
  | { readonly ok: true; readonly value: unknown }
> {
  const contentLength = request.headers.get("content-length");

  if (
    contentLength &&
    (!contentLengthPattern.test(contentLength) ||
      Number(contentLength) > maximumClientErrorReportBytes)
  ) {
    return { ok: false, tooLarge: true };
  }

  if (!request.body) {
    return { ok: false, tooLarge: false };
  }

  const chunks: Uint8Array[] = [];
  const reader = request.body.getReader();
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalBytes += value.byteLength;

      if (totalBytes > maximumClientErrorReportBytes) {
        await reader.cancel();
        return { ok: false, tooLarge: true };
      }

      chunks.push(value);
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;

    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

    return { ok: true, value: JSON.parse(source) as unknown };
  } catch {
    return { ok: false, tooLarge: false };
  }
}
