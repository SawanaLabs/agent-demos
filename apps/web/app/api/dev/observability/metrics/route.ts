import { env } from "@/env";
import { isDevelopmentObservabilityAvailable } from "@/features/shared/observability/server/development";
import { renderDevelopmentObservabilityMetrics } from "@/features/shared/observability/server/metrics";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const unavailableBody = {
  error:
    "Development observability metrics are only available during local development.",
  ok: false,
};

export function GET() {
  if (!isDevelopmentObservabilityAvailable(env)) {
    return Response.json(unavailableBody, {
      headers: {
        "cache-control": "no-store",
      },
      status: 404,
    });
  }

  return new Response(renderDevelopmentObservabilityMetrics(), {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/plain; version=0.0.4; charset=utf-8",
    },
  });
}
