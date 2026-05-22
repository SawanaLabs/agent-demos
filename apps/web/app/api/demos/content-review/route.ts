import { handleContentReviewRequest } from "@/features/content-review/server/runtime";

export const maxDuration = 30;

export async function POST(request: Request) {
  return handleContentReviewRequest(request);
}
