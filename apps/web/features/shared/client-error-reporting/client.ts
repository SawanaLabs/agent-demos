"use client";

export type ClientExceptionKind =
  | "global_error"
  | "route_error"
  | "unhandled_rejection"
  | "window_error";

export type ClientExceptionSource =
  | "app-error-boundary"
  | "app-global-error-boundary";

interface ReportClientExceptionInput {
  error: Error;
  kind: ClientExceptionKind;
  source: ClientExceptionSource;
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
  const reportKey = [kind, source, path, message].join(":");

  if (reportedClientExceptionKeys.has(reportKey)) {
    return;
  }

  reportedClientExceptionKeys.add(reportKey);

  const body = JSON.stringify({
    kind,
    source,
  });

  let beaconSent = false;

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      beaconSent = navigator.sendBeacon("/api/client-errors", blob);
    }
  } catch {
    // Fall through to fetch without allowing telemetry to affect the app.
  }

  if (beaconSent) {
    return;
  }

  try {
    fetch("/api/client-errors", {
      body,
      headers: {
        "content-type": "application/json",
      },
      keepalive: true,
      method: "POST",
    }).catch(() => undefined);
  } catch {
    // Client reporting is always best effort.
  }
}
