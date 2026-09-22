import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { afterAll, expect, it, vi } from "vitest";
import { prepareSubmission } from "../client/submission";
import { submitToDemoInbox } from "../client/submit";
import { handleFeedbackRequest } from "./runtime";
import { feedbackRedis } from "./store";

const owner = randomUUID();
const token = randomUUID();
const idempotency = randomUUID();
const base = ["widget", "feedback_submission_sessions"];
const headers = {
  "x-project-key": "feedback-agent",
  "x-submission-token": token,
  "x-idempotency-key": idempotency,
  "x-mtb-capture-policy": "sensitive-data-v1",
};
function request(method: string, body?: BodyInit, extraHeaders = {}) {
  return new Request("http://localhost/api/demos/feedback-agent", {
    method,
    body,
    headers: { ...headers, ...extraHeaders },
  });
}
async function create() {
  const form = new FormData();
  form.set("feedback[description]", "Export report does not download a file.");
  return handleFeedbackRequest(request("POST", form), owner, base);
}

afterAll(() => feedbackRedis().disconnect());

it("stores privately, finalizes once across concurrent retries, and persists status", async () => {
  const first = await create();
  expect(first.status).toBe(201);
  const { submission_session: session } = await first.json();
  expect(session.ai_clarify_available).toBe(false);
  expect((await create()).status).toBe(200);
  expect(
    await (await handleFeedbackRequest(request("GET"), owner)).json()
  ).toEqual({ feedback: [] });
  const invalid = await handleFeedbackRequest(
    request("POST", undefined, { "x-submission-token": randomUUID() }),
    owner,
    [...base, session.id, "feedback"]
  );
  expect(invalid.status).toBe(403);
  const image = await sharp({
    create: { width: 2, height: 2, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  const capture = new FormData();
  capture.set(
    "screenshot",
    new File([new Uint8Array(image)], "capture.png", { type: "image/png" })
  );
  expect(
    (
      await handleFeedbackRequest(request("PUT", capture), owner, [
        ...base,
        session.id,
        "screenshot",
      ])
    ).status
  ).toBe(204);
  const finalized = await Promise.all(
    [1, 2].map(() =>
      handleFeedbackRequest(request("POST"), owner, [
        ...base,
        session.id,
        "feedback",
      ])
    )
  );
  expect(finalized.map((response) => response.status).sort()).toEqual([
    200, 201,
  ]);
  const list = await (
    await handleFeedbackRequest(request("GET"), owner)
  ).json();
  expect(list.feedback).toHaveLength(1);
  const otherOwner = await handleFeedbackRequest(request("GET"), randomUUID(), [
    "feedback",
    session.id,
  ]);
  expect(otherOwner.status).toBe(404);
  const updated = await handleFeedbackRequest(
    request("PATCH", JSON.stringify({ status: "resolved" }), {
      "content-type": "application/json",
    }),
    owner,
    ["feedback", session.id]
  );
  expect(updated.status).toBe(200);
  const detail = await (
    await handleFeedbackRequest(request("GET"), owner, ["feedback", session.id])
  ).json();
  expect(detail.feedback.status).toBe("resolved");
  expect(detail.feedback.screenshot).toMatch(/^data:image\/png;base64,/);
  expect(
    (
      await handleFeedbackRequest(request("DELETE"), owner, [
        ...base,
        session.id,
      ])
    ).status
  ).toBe(409);
});

it("abandonment clears evidence and never creates a report", async () => {
  const form = new FormData();
  form.set("feedback[description]", "Discard this draft");
  const created = await handleFeedbackRequest(
    request("POST", form, { "x-idempotency-key": randomUUID() }),
    owner,
    base
  );
  const { submission_session: session } = await created.json();
  expect(
    (
      await handleFeedbackRequest(request("DELETE"), owner, [
        ...base,
        session.id,
      ])
    ).status
  ).toBe(204);
  expect(
    (
      await handleFeedbackRequest(request("POST"), owner, [
        ...base,
        session.id,
        "feedback",
      ])
    ).status
  ).toBe(409);
});

it("native collector retries a lost finalization response without duplicating feedback", async () => {
  const visitor = randomUUID();
  let loseResponse = true;
  const transport = vi
    .spyOn(globalThis, "fetch")
    .mockImplementation(async (input, init) => {
      const url = new URL(String(input), "http://localhost");
      const path = url.pathname
        .replace("/api/demos/feedback-agent/", "")
        .split("/");
      const response = await handleFeedbackRequest(
        new Request(url, init),
        visitor,
        path
      );
      if (path.at(-1) === "feedback" && loseResponse) {
        loseResponse = false;
        throw new Error("Connection lost after saving");
      }
      return response;
    });
  try {
    const capture = {
      context: {
        page_url: "http://localhost/report",
        user_agent: "test",
        browser: "test",
        os: "test",
        screen_width: 1200,
        screen_height: 800,
      },
      base: null,
      preview: null,
      color: "black",
    };
    const submission = await prepareSubmission(
      capture,
      "Native text-only feedback",
      [],
      false,
      randomUUID()
    );
    await expect(submitToDemoInbox(submission)).rejects.toThrow(
      "Connection lost"
    );
    const id = await submitToDemoInbox(submission);
    const list = await (
      await handleFeedbackRequest(request("GET"), visitor)
    ).json();
    expect(list.feedback.map((item: { id: string }) => item.id)).toEqual([id]);
    const detail = await (
      await handleFeedbackRequest(request("GET"), visitor, ["feedback", id])
    ).json();
    expect(detail.feedback.description).toBe("Native text-only feedback");
    expect(detail.feedback.screenshot).toBeUndefined();
  } finally {
    transport.mockRestore();
  }
});
