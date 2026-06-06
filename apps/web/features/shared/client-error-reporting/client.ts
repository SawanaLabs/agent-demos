"use client";

export type ClientExceptionKind =
  | "global_error"
  | "route_error"
  | "unhandled_rejection"
  | "window_error";

interface ReportClientExceptionInput {
  error: Error & { digest?: string };
  kind: ClientExceptionKind;
  source: string;
}

const reportedClientExceptionKeys = new Set<string>();

export function reportClientException({
  error,
  kind,
  source,
}: ReportClientExceptionInput) {
  if (typeof window === "undefined") {
    return;
  }

  const message = error.message || "Unknown client exception.";
  const path = window.location.pathname;
  const reportKey = [kind, source, path, error.digest ?? "", message].join(":");

  if (reportedClientExceptionKeys.has(reportKey)) {
    return;
  }

  reportedClientExceptionKeys.add(reportKey);

  const body = JSON.stringify({
    digest: error.digest,
    kind,
    message,
    path,
    source,
    stack: error.stack,
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/client-errors", blob);
    return;
  }

  fetch("/api/client-errors", {
    body,
    headers: {
      "content-type": "application/json",
    },
    keepalive: true,
    method: "POST",
  }).catch(() => undefined);
}
