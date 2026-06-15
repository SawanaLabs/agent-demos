import { handleGenerativeUiRequest } from "@/features/generative-ui/server/runtime";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const runtime = "nodejs";

export const POST = createMeteredDemoRoute({
  action: "send_message",
  demoSlug: "generative-ui",
  handler: ({ request }) => handleGenerativeUiRequest(request),
});
