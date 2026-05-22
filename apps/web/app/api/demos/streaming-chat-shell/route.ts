import { handleStreamingChatShellRequest } from "@/features/streaming-chat-shell/server/runtime";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleStreamingChatShellRequest(request);
}
