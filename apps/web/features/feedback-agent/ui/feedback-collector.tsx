"use client";

import type { FeedbackSubmission } from "../client/submission";
import { FeedbackCapture } from "./feedback-capture";
import { useFeedbackCapture } from "./use-feedback-capture";

export type { FeedbackSubmission } from "../client/submission";

/** Mount once in your layout. Resolve onSubmit only after saving succeeds. */
export function FeedbackCollector({
  onSubmit,
  disabled = false,
}: {
  onSubmit: (submission: FeedbackSubmission) => Promise<unknown>;
  disabled?: boolean;
}) {
  const controller = useFeedbackCapture(onSubmit);
  return <FeedbackCapture controller={controller} enabled={!disabled} />;
}
