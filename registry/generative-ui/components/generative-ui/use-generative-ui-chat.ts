"use client";

import { useDemoChat } from "@/components/demo-chat/use-demo-chat";

export function useGenerativeUiChat() {
  return useDemoChat({ api: "/api/demos/generative-ui" });
}
