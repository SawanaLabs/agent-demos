import {
  acceptedDemoActionHeader,
  serializeAcceptedDemoAction,
} from "../shared/demo-action-contract";

export function markAcceptedDemoAction(
  response: Response,
  input: {
    readonly action: unknown;
    readonly demoSlug: unknown;
  }
): void {
  if (!response.ok) {
    return;
  }

  const value = serializeAcceptedDemoAction(input);

  if (!value) {
    return;
  }

  try {
    response.headers.set(acceptedDemoActionHeader, value);
  } catch {
    // Analytics metadata must never replace an accepted demo response.
  }
}
