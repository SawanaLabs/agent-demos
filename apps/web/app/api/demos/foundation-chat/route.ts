import { handleFoundationChatRequest } from "@/features/foundation-chat/server/runtime";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleFoundationChatRequest(request);
}
