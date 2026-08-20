import { describe, expect, it, vi } from "vitest";

import { dispatchAcceptedImageWorkflowAction } from "./telemetry";

describe("image workflow accepted-action sequencing", () => {
  it("records a sent message even when the later provider response fails", async () => {
    const onAcceptedAction = vi.fn();
    const dispatch = vi.fn(() =>
      Promise.reject(new Error("Provider response failed."))
    );

    const pendingResponse = dispatchAcceptedImageWorkflowAction(
      {
        action: "send_message",
        source: "manual",
      },
      dispatch,
      { onAcceptedAction }
    );

    expect(dispatch).toHaveBeenCalledOnce();
    expect(onAcceptedAction).toHaveBeenCalledOnce();
    await expect(pendingResponse).rejects.toThrowError(
      "Provider response failed."
    );
  });
});
