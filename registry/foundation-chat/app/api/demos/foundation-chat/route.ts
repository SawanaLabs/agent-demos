import { handleFoundationChatRequest } from "@/lib/foundation-chat/runtime";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleFoundationChatRequest(request);
}
