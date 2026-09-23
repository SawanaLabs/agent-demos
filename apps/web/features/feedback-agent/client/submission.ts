import type { Annotation } from "../upstream/types";
import {
  type Capture,
  type DrawStroke,
  renderScreenshot,
  screenshotAnnotations,
} from "./capture";

/** Browser evidence only; the host owns transport, validation, and persistence. */
export interface FeedbackSubmission {
  annotations: Annotation[];
  context: Capture["context"];
  description: string;
  idempotencyKey: string;
  screenshot?: Blob;
  target?: { selector?: string; name?: string };
}

export async function prepareSubmission(
  capture: Capture,
  description: string,
  paths: DrawStroke[],
  includeScreenshot: boolean,
  idempotencyKey: string
): Promise<FeedbackSubmission> {
  return {
    idempotencyKey,
    description,
    context: capture.context,
    annotations: screenshotAnnotations(capture, includeScreenshot ? paths : []),
    target: capture.annotation
      ? {
          selector: capture.annotation.targetSelector,
          name: capture.annotation.targetName,
        }
      : undefined,
    screenshot: includeScreenshot
      ? await renderScreenshot(capture, paths)
      : undefined,
  };
}
