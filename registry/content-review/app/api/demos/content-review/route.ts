import { handleContentReviewRequest } from "@/lib/content-review/runtime";

export const maxDuration = 30;

export async function POST(request: Request) {
  return handleContentReviewRequest(request);
}
