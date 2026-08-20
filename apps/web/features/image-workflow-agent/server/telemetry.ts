export interface ImageWorkflowFailureObservation {
  readonly durationMs: number;
  readonly failureCategory: "provider" | "runtime" | "tool";
  readonly operation: "chat" | "tool_call" | "workflow_run";
  readonly retryable: boolean;
}

export interface ImageWorkflowTelemetryObserver {
  onFailure(observation: ImageWorkflowFailureObservation): void;
}

export class ImageWorkflowObservedFailure extends Error {}

export function reportImageWorkflowFailure(
  observer: ImageWorkflowTelemetryObserver | undefined,
  observation: ImageWorkflowFailureObservation
): void {
  try {
    observer?.onFailure(observation);
  } catch {
    // A host telemetry adapter never owns the portable workflow.
  }
}
