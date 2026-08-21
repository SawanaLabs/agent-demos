export type ImageWorkflowAcceptedAction =
  | {
      readonly action: "modify_workflow";
      readonly source: "agent" | "manual";
    }
  | {
      readonly action: "run_workflow";
      readonly hasReferenceImage: boolean;
      readonly source: "agent" | "manual";
    }
  | {
      readonly action: "send_message";
      readonly source: "agent" | "manual";
    };

export interface ImageWorkflowProductTelemetry {
  onAcceptedAction(action: ImageWorkflowAcceptedAction): void;
}

export function normalizeImageWorkflowAcceptedAction(
  input: unknown
): ImageWorkflowAcceptedAction | null {
  if (!input || typeof input !== "object") {
    return null;
  }

  const action = input as Readonly<Record<string, unknown>>;
  const source = action.source;

  if (source !== "agent" && source !== "manual") {
    return null;
  }

  if (action.action === "modify_workflow") {
    return { action: "modify_workflow", source };
  }

  if (action.action === "send_message") {
    return { action: "send_message", source };
  }

  if (
    action.action === "run_workflow" &&
    typeof action.hasReferenceImage === "boolean"
  ) {
    return {
      action: "run_workflow",
      hasReferenceImage: action.hasReferenceImage,
      source,
    };
  }

  return null;
}

export function dispatchAcceptedImageWorkflowAction<T>(
  action: ImageWorkflowAcceptedAction,
  dispatch: () => Promise<T>,
  telemetry: ImageWorkflowProductTelemetry
): Promise<T> {
  const pendingResponse = dispatch();
  telemetry.onAcceptedAction(action);
  return pendingResponse;
}

export const noopImageWorkflowProductTelemetry: ImageWorkflowProductTelemetry =
  {
    onAcceptedAction: () => undefined,
  };
