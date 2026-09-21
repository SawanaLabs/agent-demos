import { createHmac } from "node:crypto";
import { env } from "@/env";

/** Only Vercel's edge-provided IP is trusted. Local development ignores IP headers. */
export function resolveFreeVisitorId(
  request: Request,
  environment: Readonly<Record<string, string | undefined>> = env
) {
  const onVercel = environment.VERCEL === "1" || !!environment.VERCEL_ENV;
  const local = !onVercel && environment.NODE_ENV !== "production";
  if (!(onVercel || local)) {
    throw new Error("Free visitor identity requires a trusted Vercel edge.");
  }
  const secret =
    environment.SITE_USAGE_VISITOR_SECRET ??
    (local ? "local-only-site-usage-visitor-secret" : "");
  if (secret.length < 32) {
    throw new Error(
      "SITE_USAGE_VISITOR_SECRET must contain at least 32 characters."
    );
  }
  const ip = local
    ? "local-development"
    : request.headers.get("x-vercel-forwarded-for")?.trim();
  if (!ip) {
    throw new Error("Trusted visitor IP is missing.");
  }
  // Missing User-Agent is a stable bucket too; it never creates a random identity.
  const userAgent = request.headers.get("user-agent") ?? "";
  return `free-v1-${createHmac("sha256", secret)
    .update(JSON.stringify([ip, userAgent]))
    .digest("hex")}`;
}
