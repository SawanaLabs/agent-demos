import type { Capture } from "./capture";
import { renderScreenshot, screenshotAnnotations } from "./capture";

const API = "/api/demos/feedback-agent/widget/feedback_submission_sessions";
export interface SubmissionIdentity {
  key: string;
  token: string;
}
export function newSubmissionIdentity(): SubmissionIdentity {
  return { token: crypto.randomUUID(), key: crypto.randomUUID() };
}
async function request(path: string, headers: HeadersInit, body?: FormData) {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers,
    body,
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error ?? "Feedback could not be sent.");
  }
  return result;
}
export async function submitCapture(
  capture: Capture,
  description: string,
  paths: string[],
  includeScreenshot: boolean,
  identity: SubmissionIdentity
): Promise<string> {
  const form = new FormData();
  form.set("feedback[description]", description);
  for (const [key, value] of Object.entries(capture.context)) {
    form.set(`feedback[${key}]`, String(value));
  }
  form.set(
    "feedback[annotations]",
    JSON.stringify(
      screenshotAnnotations(capture, includeScreenshot ? paths : [])
    )
  );
  if (capture.annotation) {
    form.set(
      "feedback[target_element]",
      JSON.stringify({
        selector: capture.annotation.targetSelector,
        name: capture.annotation.targetName,
      })
    );
  }
  if (includeScreenshot) {
    form.set(
      "feedback[screenshot]",
      await renderScreenshot(capture, paths),
      "capture.jpg"
    );
  }
  const headers = {
    "x-project-key": "feedback-agent",
    "x-submission-token": identity.token,
    "x-idempotency-key": identity.key,
    "x-mtb-capture-policy": "sensitive-data-v1",
  };
  const session = await request("", headers, form);
  const result = await request(
    `/${session.submission_session.id}/feedback`,
    headers
  );
  return result.feedback.id;
}
