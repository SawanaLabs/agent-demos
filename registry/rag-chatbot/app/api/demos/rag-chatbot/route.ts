import { handleRagChatbotRequest } from "@/lib/rag-chatbot/runtime";

export const runtime = "nodejs";
export const maxDuration = 30;

export function POST(request: Request) {
  return handleRagChatbotRequest(request);
}
