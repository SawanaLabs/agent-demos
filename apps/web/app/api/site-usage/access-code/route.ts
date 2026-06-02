import { z } from "zod";
import {
  redeemSiteUsageAccessCode,
  type SiteUsageAccessCodeRedeemResult,
} from "@/features/site-usage-gate/server/store";
import {
  appendSiteUsageVisitorCookie,
  resolveSiteUsageViewerContext,
} from "@/features/site-usage-gate/server/viewer-context";

const accessCodeRequestSchema = z.object({
  code: z.string().trim().min(1).max(191),
});

export async function POST(request: Request) {
  const viewer = resolveSiteUsageViewerContext({ request });
  const parsedBody = accessCodeRequestSchema.safeParse(await readJson(request));

  if (!parsedBody.success) {
    return withVisitorCookie(
      Response.json(
        {
          error: "Invalid code request.",
          ok: false,
        },
        { status: 400 }
      ),
      viewer
    );
  }

  const result = await redeemSiteUsageAccessCode({
    code: parsedBody.data.code,
    now: new Date(),
    visitorId: viewer.visitorId,
  });

  return withVisitorCookie(createAccessCodeResponse(result), viewer);
}

function createAccessCodeResponse(result: SiteUsageAccessCodeRedeemResult) {
  if (!result.ok) {
    return Response.json(
      {
        error: "Invalid code.",
        ok: false,
      },
      { status: 400 }
    );
  }

  return Response.json({
    ok: true,
    policy: {
      allowanceUnits: result.policy.allowanceUnits,
      scope: "access_code",
      windowSeconds: result.policy.windowSeconds,
    },
  });
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
  return appendSiteUsageVisitorCookie(response, viewer);
}
