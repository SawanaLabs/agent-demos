import { put } from "@vercel/blob";
import { getVercelBlobToken } from "@/features/shared/vercel-blob/server/env";
import {
  canvasImageDataSchema,
  canvasImageTypes,
  canvasImageUrlSchema,
  imageExtension,
  maxCanvasImageBytes,
} from "../model/image";

export async function storeCanvasImage(image: string, signal?: AbortSignal) {
  canvasImageDataSchema.parse(image);
  const contentType = image.slice(5, image.indexOf(";"));
  const bytes = Buffer.from(image.slice(image.indexOf(",") + 1), "base64");
  if (bytes.length > maxCanvasImageBytes) {
    throw new Error("图片超过 8 MB 存储上限。");
  }
  const stored = await put(
    `canvas-agent/results/${crypto.randomUUID()}.${imageExtension(image)}`,
    bytes,
    {
      access: "public",
      contentType,
      token: getVercelBlobToken(),
      abortSignal: signal,
    }
  );
  return canvasImageUrlSchema.parse(stored.url);
}

export async function loadCanvasImage(image: string, signal?: AbortSignal) {
  if (image.startsWith("data:")) {
    return canvasImageDataSchema.parse(image);
  }
  canvasImageUrlSchema.parse(image);
  const response = await fetch(image, { signal, redirect: "error" });
  if (!response.ok) {
    throw new Error(`图片资源读取失败 (${response.status})。`);
  }
  const type = response.headers.get("content-type")?.split(";")[0];
  if (!canvasImageTypes.some((value) => value === type)) {
    throw new Error("图片资源类型不受支持。");
  }
  // Bound downloaded bytes as well as the upload token's limit.
  const chunks: Uint8Array[] = [];
  let size = 0;
  if (!response.body) {
    throw new Error("图片资源为空。");
  }
  const reader = response.body.getReader();
  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) {
      break;
    }
    size += chunk.length;
    if (size > maxCanvasImageBytes) {
      await reader.cancel();
      throw new Error("图片超过 8 MB 读取上限。");
    }
    chunks.push(chunk);
  }
  return `data:${type};base64,${Buffer.concat(chunks).toString("base64")}`;
}
