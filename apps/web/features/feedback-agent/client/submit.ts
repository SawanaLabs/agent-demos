import type { FeedbackSubmission } from "./submission";

const API = "/api/demos/feedback-agent/widget/feedback_submission_sessions";
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

/** Transport for this demo's inbox. The portable collector does not import it. */
export async function submitToDemoInbox(
  submission: FeedbackSubmission
): Promise<string> {
  const form = new FormData();
  form.set("feedback[description]", submission.description);
  for (const [key, value] of Object.entries(submission.context)) {
    form.set(`feedback[${key}]`, String(value));
  }
  form.set("feedback[annotations]", JSON.stringify(submission.annotations));
  if (submission.target) {
    form.set("feedback[target_element]", JSON.stringify(submission.target));
  }
  if (submission.screenshot) {
    form.set("feedback[screenshot]", submission.screenshot, "capture.jpg");
  }
  const headers = {
    "x-project-key": "feedback-agent",
    "x-submission-token": submission.idempotencyKey,
    "x-idempotency-key": submission.idempotencyKey,
    "x-mtb-capture-policy": "sensitive-data-v1",
  };
  const session = await request("", headers, form);
  const result = await request(
    `/${session.submission_session.id}/feedback`,
    headers
  );
  return result.feedback.id;
}
