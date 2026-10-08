import { handleGatewayImageRequest } from "@/features/cloudflare-ai-gateway/server/runtime";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const maxDuration = 180;
export const POST = createMeteredDemoRoute({
  action: "image_generation",
  demoSlug: "cloudflare-ai-gateway",
  productAction: "generate_image",
  handler: ({ request }) => handleGatewayImageRequest(request),
});
