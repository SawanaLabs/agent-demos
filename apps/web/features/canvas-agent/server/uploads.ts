import { list } from "@vercel/blob";
import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { getVercelBlobToken } from "@/features/shared/vercel-blob/server/env";
import { canvasImageTypes, maxCanvasImageBytes } from "../model/image";

export function canvasUploadPrefix(visitorId: string) {
  if (!/^[A-Za-z0-9_-]{8,191}$/.test(visitorId)) {
    throw new Error("上传身份无效。");
  }
  return `canvas-agent/uploads/${visitorId}/${new Date().toISOString().slice(0, 10)}/`;
}

export async function handleCanvasUpload(request: Request, visitorId: string) {
  try {
    const token = getVercelBlobToken();
    const result = await handleUpload({
      request,
      token,
      body: (await request.json()) as HandleUploadBody,
      onBeforeGenerateToken: async (pathname) => {
        if (request.headers.get("origin") !== new URL(request.url).origin) {
          throw new Error("上传来源无效。");
        }
        const prefix = canvasUploadPrefix(visitorId);
        if (
          !(
            pathname.startsWith(prefix) &&
            /^[a-f0-9-]{36}\.(png|jpeg|webp|gif)$/.test(
              pathname.slice(prefix.length)
            )
          )
        ) {
          throw new Error("上传路径无效。");
        }
        const usage = await list({ prefix, limit: 20, token });
        if (
          usage.blobs.length >= 20 ||
          usage.blobs.reduce((sum, blob) => sum + blob.size, 0) >=
            64 * 1024 * 1024
        ) {
          throw new Error("今日图片上传额度已用完。");
        }
        return {
          allowedContentTypes: [...canvasImageTypes],
          maximumSizeInBytes: maxCanvasImageBytes,
          validUntil: Date.now() + 5 * 60 * 1000,
          addRandomSuffix: true,
          allowOverwrite: false,
        };
      },
    });
    return Response.json(result);
  } catch {
    return Response.json(
      { error: "图片上传授权失败，请检查 Blob 配置或今日上传额度。" },
      { status: 400 }
    );
  }
}
