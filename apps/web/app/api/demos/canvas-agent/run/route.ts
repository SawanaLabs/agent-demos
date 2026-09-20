import { handleCanvasRun } from "@/features/canvas-agent/server/handler";
import { createCanvasFailureObserver } from "@/features/site-runtime-logging/server/canvas-adapter";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";
export const runtime = "nodejs";
export const maxDuration = 300;
export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "canvas-agent",
  handler: ({ request }) =>
    handleCanvasRun(request, createCanvasFailureObserver("manual")),
});
