import { describe, expect, it, vi } from "vitest";

import { createImageWorkflowProductTelemetry } from "./image-workflow-adapter";

describe("host image workflow analytics adapter", () => {
  it("maps portable accepted actions into bounded site events", () => {
    const track = vi.fn();
    const telemetry = createImageWorkflowProductTelemetry(track);

    telemetry.onAcceptedAction({
      action: "modify_workflow",
      source: "manual",
    });
    telemetry.onAcceptedAction({
      action: "run_workflow",
      hasReferenceImage: true,
      source: "agent",
    });

    expect(track).toHaveBeenNthCalledWith(1, {
      action: "modify_workflow",
      demo_slug: "image-workflow-agent",
      source: "manual",
    });
    expect(track).toHaveBeenNthCalledWith(2, {
      action: "run_workflow",
      demo_slug: "image-workflow-agent",
      has_reference_image: true,
      source: "agent",
    });
  });

  it("isolates analytics provider failures from accepted product actions", () => {
    const telemetry = createImageWorkflowProductTelemetry(() => {
      throw new Error("Provider unavailable.");
    });

    expect(() =>
      telemetry.onAcceptedAction({
        action: "send_message",
        source: "manual",
      })
    ).not.toThrow();
  });
});
