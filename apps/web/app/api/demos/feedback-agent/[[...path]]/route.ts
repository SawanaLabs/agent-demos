import { feedbackOwner } from "@/features/feedback-agent/server/owner";
import { handleFeedbackRequest } from "@/features/feedback-agent/server/runtime";
import { createMeteredDemoRoute } from "@/features/site-usage-gate/server/metered-demo-route";

export const runtime = "nodejs";
export const maxDuration = 90;
interface Context {
  params: Promise<{ path?: string[] }>;
}

async function route(request: Request, context: Context) {
  const { path } = await context.params;
  return feedbackOwner.handleOwnedRequest(request, (ownedRequest, visitor) =>
    handleFeedbackRequest(ownedRequest, visitor.visitorId, path)
  );
}

const meteredAnalysis = createMeteredDemoRoute<Context>({
  action: "send_message",
  demoSlug: "feedback-agent",
  handler: ({ request, context }) => route(request, context),
});

export async function POST(request: Request, context: Context) {
  const { path } = await context.params;
  return path?.[0] === "feedback" && path[2] === "analyze"
    ? meteredAnalysis(request, context)
    : route(request, context);
}
export const GET = route;
export const PATCH = route;
export const DELETE = route;
export const PUT = route;
