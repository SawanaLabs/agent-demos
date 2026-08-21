"use client";

import { sendGAEvent } from "@next/third-parties/google";

import type { DemoActionEvent } from "../shared/demo-action-contract";
import { dispatchDemoAction } from "./events";

declare global {
  interface Window {
    gtag?: (...arguments_: unknown[]) => void;
  }
}

export function trackDemoAction(event: DemoActionEvent): void {
  try {
    if (typeof window === "undefined" || !window.gtag) {
      return;
    }

    dispatchDemoAction((eventName, parameters) => {
      sendGAEvent("event", eventName, parameters);
    }, event);
  } catch {
    // Provider readiness checks must not interrupt the product workflow.
  }
}
