import { handleContentReviewRecordRequest } from "@/lib/content-review/review-records";

export async function GET(request: Request) {
  return handleContentReviewRecordRequest(request);
}
