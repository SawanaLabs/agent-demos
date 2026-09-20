import { handleCanvasChat } from "@/features/canvas-agent/server/handler";
import { createCanvasFailureObserver } from "@/features/site-runtime-logging/server/canvas-adapter";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";
export const runtime = "nodejs";
export const maxDuration = 300;
export const POST = createMeteredDemoRoute({
  action: "send_message",
  chargeMessage: false,
  demoSlug: "canvas-agent",
  handler: ({ request }) =>
    handleCanvasChat(request, createCanvasFailureObserver("agent")),
});
