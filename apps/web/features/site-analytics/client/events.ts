import {
  type DemoActionEvent,
  normalizeDemoAction,
} from "../shared/demo-action-contract";

export type DemoActionProvider = (
  eventName: "demo_action",
  parameters: DemoActionEvent
) => void;

export function dispatchDemoAction(
  provider: DemoActionProvider,
  event: DemoActionEvent
): void {
  try {
    const normalizedEvent = normalizeDemoAction(event);

    if (normalizedEvent) {
      provider("demo_action", normalizedEvent);
    }
  } catch {
    // Analytics providers never own the product workflow.
  }
}
