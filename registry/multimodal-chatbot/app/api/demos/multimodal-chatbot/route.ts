import { handleMultimodalChatbotRequest } from "@/lib/multimodal-chatbot/runtime";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleMultimodalChatbotRequest(request);
}
