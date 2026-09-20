import {
  canvasUploadPrefix,
  handleCanvasUpload,
} from "@/features/canvas-agent/server/uploads";
import {
  appendSiteUsageVisitorCookie,
  resolveSiteUsageViewerContext,
} from "@/features/site-usage-gate/server/viewer-context";

export const runtime = "nodejs";

export function GET(request: Request) {
  const viewer = resolveSiteUsageViewerContext({ request });
  return appendSiteUsageVisitorCookie(
    Response.json(
      {
        pathname: `${canvasUploadPrefix(viewer.visitorId)}${crypto.randomUUID()}`,
      },
      { headers: { "Cache-Control": "no-store" } }
    ),
    viewer
  );
}

export function POST(request: Request) {
  const viewer = resolveSiteUsageViewerContext({ request });
  return handleCanvasUpload(request, viewer.visitorId);
}
