"use client";

import type { DemoActionEvent } from "../shared/demo-action-contract";
import {
  acceptedDemoActionHeader,
  parseAcceptedDemoAction,
} from "../shared/demo-action-contract";

export type DemoActionTracker = (event: DemoActionEvent) => void;
export type FetchImplementation = typeof globalThis.fetch;

function isExpectedDemoRouteResponse({
  event,
  fetchInput,
  origin,
  response,
}: {
  readonly event: DemoActionEvent;
  readonly fetchInput: Parameters<FetchImplementation>[0];
  readonly origin: string;
  readonly response: Response;
}): boolean {
  try {
    const trustedOrigin = new URL(origin).origin;
    let requestTarget: string;

    if (typeof fetchInput === "string") {
      requestTarget = fetchInput;
    } else if (fetchInput instanceof URL) {
      requestTarget = fetchInput.href;
    } else {
      requestTarget = fetchInput.url;
    }

    const requestUrl = new URL(requestTarget, trustedOrigin);
    const demoPath = `/api/demos/${event.demo_slug}`;
    const matchesDemoPath = (url: URL) =>
      url.origin === trustedOrigin &&
      (url.pathname === demoPath || url.pathname.startsWith(`${demoPath}/`));

    if (!matchesDemoPath(requestUrl)) {
      return false;
    }

    return response.url ? matchesDemoPath(new URL(response.url)) : true;
  } catch {
    return false;
  }
}

export function createAcceptedDemoActionFetchObserver({
  fetchImplementation,
  origin,
  track,
}: {
  readonly fetchImplementation: FetchImplementation;
  readonly origin: string;
  readonly track: DemoActionTracker;
}): FetchImplementation {
  return async (...arguments_) => {
    const response = await fetchImplementation(...arguments_);

    try {
      const event = parseAcceptedDemoAction(
        response.headers.get(acceptedDemoActionHeader)
      );

      if (
        event &&
        isExpectedDemoRouteResponse({
          event,
          fetchInput: arguments_[0],
          origin,
          response,
        })
      ) {
        track(event);
      }
    } catch {
      // Host analytics must never own the accepted product response.
    }

    return response;
  };
}
