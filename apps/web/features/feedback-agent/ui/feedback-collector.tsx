"use client";

import type { ReactNode } from "react";
import type { FeedbackSubmission } from "../client/submission";
import { FeedbackCapture } from "./feedback-capture";
import { useFeedbackCapture } from "./use-feedback-capture";

export type { FeedbackSubmission } from "../client/submission";

/** Mount once in your layout. Resolve onSubmit only after saving succeeds. */
export function FeedbackCollector({
  onSubmit,
  disabled = false,
  renderTrigger,
}: {
  onSubmit: (submission: FeedbackSubmission) => Promise<unknown>;
  disabled?: boolean;
  renderTrigger: (props: {
    onClick: () => void;
    disabled: boolean;
  }) => ReactNode;
}) {
  const controller = useFeedbackCapture(onSubmit);
  return (
    <>
      {renderTrigger({
        onClick: controller.open,
        disabled: disabled || controller.phase !== "closed",
      })}
      <FeedbackCapture controller={controller} enabled={!disabled} />
    </>
  );
}
