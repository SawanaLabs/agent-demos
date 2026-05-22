import { handleStreamingChatShellEventsRequest } from "@/features/streaming-chat-shell/server/events";

export const runtime = "nodejs";

export function POST(request: Request) {
  return handleStreamingChatShellEventsRequest(request);
}
