import { contentReviewRecordIdHeader } from "@/lib/content-review/record";
import {
  completeContentReviewRecord,
  createPendingContentReviewRecord,
  failContentReviewRecord,
} from "@/lib/content-review/review-records";
import type { ContentReviewStreamResult } from "@/lib/content-review/runtime";

const parseReviewObjectError = "Failed to parse final structured object.";
const recordTokenUsageError = "Failed to record token usage.";
const contentReviewStreamError = "Content review stream failed.";

export function startRecordedReviewRun(stream: ContentReviewStreamResult) {
  const recordId = crypto.randomUUID();

  createPendingContentReviewRecord(recordId);

  return createRecordedReviewResponse(stream, recordId);
}

function createRecordedReviewResponse(
  stream: ContentReviewStreamResult,
  recordId: string
) {
  const encoder = new TextEncoder();
  let accumulatedText = "";

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream.textStream) {
          accumulatedText += chunk;
          controller.enqueue(encoder.encode(chunk));
        }

        let parsedResult: unknown;

        try {
          parsedResult = JSON.parse(accumulatedText);
        } catch (error) {
          failContentReviewRecord(
            recordId,
            error instanceof Error ? error.message : parseReviewObjectError
          );
          controller.close();
          return;
        }

        try {
          const usage = await stream.totalUsage;
          completeContentReviewRecord(recordId, parsedResult, usage);
        } catch (error) {
          failContentReviewRecord(
            recordId,
            error instanceof Error ? error.message : recordTokenUsageError
          );
        }

        controller.close();
      } catch (error) {
        failContentReviewRecord(
          recordId,
          error instanceof Error ? error.message : contentReviewStreamError
        );
        controller.error(error);
      }
    },
  });

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      [contentReviewRecordIdHeader]: recordId,
    },
  });
}
