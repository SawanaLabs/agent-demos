import { handleStreamingChatShellRequest } from "@/lib/streaming-chat-shell/runtime";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleStreamingChatShellRequest(request);
}
