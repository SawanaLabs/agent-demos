import { handleMultimodalChatbotRequest } from "@/features/multimodal-chatbot/server/runtime";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleMultimodalChatbotRequest(request);
}
