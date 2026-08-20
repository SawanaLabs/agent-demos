"use client";

import type {
  ImageWorkflowAcceptedAction,
  ImageWorkflowProductTelemetry,
} from "@/features/image-workflow-agent/model/telemetry";
import { trackDemoAction } from "./browser";

type DemoActionTracker = typeof trackDemoAction;

function toSiteEvent(action: ImageWorkflowAcceptedAction) {
  if (action.action === "run_workflow") {
    return {
      action: "run_workflow" as const,
      demo_slug: "image-workflow-agent" as const,
      has_reference_image: action.hasReferenceImage,
      source: action.source,
    };
  }

  return {
    action: action.action,
    demo_slug: "image-workflow-agent" as const,
    source: action.source,
  };
}

export function createImageWorkflowProductTelemetry(
  track: DemoActionTracker = trackDemoAction
): ImageWorkflowProductTelemetry {
  return {
    onAcceptedAction: (action) => {
      try {
        track(toSiteEvent(action));
      } catch {
        // Host analytics must never own the portable product action.
      }
    },
  };
}
