import { handleStreamingChatShellEventsRequest } from "@/lib/streaming-chat-shell/events";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleStreamingChatShellEventsRequest(request);
}
