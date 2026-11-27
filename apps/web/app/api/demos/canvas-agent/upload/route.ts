import {
  canvasUploadPrefix,
  handleCanvasUpload,
  prepareCanvasUpload,
} from "@/features/canvas-agent/server/uploads";
import { demoMediaMode } from "@/features/shared/demo-media/server/storage";
import {
  appendSiteUsageVisitorCookie,
  resolveSiteUsageViewerContext,
} from "@/features/site-usage-gate/server/viewer-context";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const viewer = resolveSiteUsageViewerContext({ request });
  if (demoMediaMode() !== "blob") {
    try {
      return appendSiteUsageVisitorCookie(
        Response.json(await prepareCanvasUpload(request, viewer.visitorId), {
          headers: { "Cache-Control": "no-store" },
        }),
        viewer
      );
    } catch {
      return Response.json({ error: "图片上传授权失败。" }, { status: 400 });
    }
  }
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
  if (demoMediaMode() !== "blob") {
    return Response.json(
      { error: "请刷新页面后重新上传图片。" },
      { status: 409 }
    );
  }
  const viewer = resolveSiteUsageViewerContext({ request });
  return handleCanvasUpload(request, viewer.visitorId);
}
