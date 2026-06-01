import { z } from "zod";
import { createSiteUsageWaitlistEntry } from "@/features/site-usage-gate/server/store";
import {
  resolveSiteUsageViewerContext,
  serializeSiteUsageVisitorCookie,
} from "@/features/site-usage-gate/server/viewer-context";

const waitlistRequestSchema = z.object({
  demoSlug: z.string().max(191).nullable().optional(),
  message: z.string().max(2000).nullable().optional(),
  supportIntent: z.literal("willing_to_support"),
});

export async function POST(request: Request) {
  const viewer = resolveSiteUsageViewerContext({ request });
  const parsedBody = waitlistRequestSchema.safeParse(await readJson(request));

  if (!parsedBody.success) {
    return withVisitorCookie(
      Response.json(
        {
          error: "Invalid waitlist request.",
          ok: false,
        },
        { status: 400 }
      ),
      viewer
    );
  }

  await createSiteUsageWaitlistEntry({
    demoSlug: parsedBody.data.demoSlug ?? null,
    message: parsedBody.data.message?.trim() || null,
    now: new Date(),
    supportIntent: parsedBody.data.supportIntent,
    visitorId: viewer.visitorId,
  });

  return withVisitorCookie(Response.json({ ok: true }), viewer);
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function withVisitorCookie(
  response: Response,
  viewer: { isNewVisitor: boolean; visitorId: string }
) {
  if (viewer.isNewVisitor) {
    response.headers.append(
      "set-cookie",
      serializeSiteUsageVisitorCookie(viewer.visitorId)
    );
  }

  return response;
}
