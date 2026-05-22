import { handleContentReviewRecordRequest } from "@/features/content-review/server/review-records";

export async function GET(request: Request) {
  return handleContentReviewRecordRequest(request);
}
