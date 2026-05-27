import { objectGenerationRecordIdHeader } from "@/lib/object-generation/record";
import {
  completeObjectGenerationRecord,
  createPendingObjectGenerationRecord,
  failObjectGenerationRecord,
} from "@/lib/object-generation/object-generation-records";
import type { ObjectGenerationStreamResult } from "@/lib/object-generation/runtime";

const parseReviewObjectError = "Failed to parse final structured object.";
const recordTokenUsageError = "Failed to record token usage.";
const objectGenerationStreamError = "Content review stream failed.";

export function startRecordedObjectGenerationRun(stream: ObjectGenerationStreamResult) {
  const recordId = crypto.randomUUID();

  createPendingObjectGenerationRecord(recordId);

  return createRecordedReviewResponse(stream, recordId);
}

function createRecordedReviewResponse(
  stream: ObjectGenerationStreamResult,
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
          failObjectGenerationRecord(
            recordId,
            error instanceof Error ? error.message : parseReviewObjectError
          );
          controller.close();
          return;
        }

        try {
          const usage = await stream.totalUsage;
          completeObjectGenerationRecord(recordId, parsedResult, usage);
        } catch (error) {
          failObjectGenerationRecord(
            recordId,
            error instanceof Error ? error.message : recordTokenUsageError
          );
        }

        controller.close();
      } catch (error) {
        failObjectGenerationRecord(
          recordId,
          error instanceof Error ? error.message : objectGenerationStreamError
        );
        controller.error(error);
      }
    },
  });

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      [objectGenerationRecordIdHeader]: recordId,
    },
  });
}
