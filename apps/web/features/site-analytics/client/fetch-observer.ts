"use client";

import type { DemoActionEvent } from "../shared/demo-action-contract";
import {
  acceptedDemoActionHeader,
  parseAcceptedDemoAction,
} from "../shared/demo-action-contract";

export type DemoActionTracker = (event: DemoActionEvent) => void;
export type FetchImplementation = typeof globalThis.fetch;

export function createAcceptedDemoActionFetchObserver({
  fetchImplementation,
  track,
}: {
  readonly fetchImplementation: FetchImplementation;
  readonly track: DemoActionTracker;
}): FetchImplementation {
  return async (...arguments_) => {
    const response = await fetchImplementation(...arguments_);

    try {
      const event = parseAcceptedDemoAction(
        response.headers.get(acceptedDemoActionHeader)
      );

      if (event) {
        track(event);
      }
    } catch {
      // Host analytics must never own the accepted product response.
    }

    return response;
  };
}
