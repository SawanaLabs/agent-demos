"use client";
import { upload } from "@vercel/blob/client";
import { z } from "zod";
import { type CanvasGraph, parseGraph } from "../model/graph";
import {
  canvasImageTypes,
  canvasImageUrlSchema,
  maxCanvasImageBytes,
} from "../model/image";

const grantSchema = z.union([
  z.object({ pathname: z.string() }),
  z.object({
    headers: z.record(z.string(), z.string()),
    uploadUrl: z.url(),
    url: canvasImageUrlSchema,
  }),
]);

export async function uploadCanvasImage(file: Blob) {
  if (
    !canvasImageTypes.some((type) => type === file.type) ||
    file.size > maxCanvasImageBytes
  ) {
    throw new Error("请选择 8 MB 以内的 PNG、JPEG、WebP 或 GIF 图片。");
  }
  const fields = new URLSearchParams({
    size: String(file.size),
    type: file.type,
  });
  const response = await fetch(`/api/demos/canvas-agent/upload?${fields}`);
  if (!response.ok) {
    throw new Error("无法准备图片上传。");
  }
  const grant = grantSchema.parse(await response.json());
  if ("uploadUrl" in grant) {
    const stored = await fetch(grant.uploadUrl, {
      body: file,
      headers: grant.headers,
      method: "PUT",
    });
    if (!stored.ok) {
      throw new Error("无法上传图片。");
    }
    return grant.url;
  }
  const { pathname } = grant;
  const stored = await upload(`${pathname}.${file.type.slice(6)}`, file, {
    access: "public",
    contentType: file.type,
    handleUploadUrl: "/api/demos/canvas-agent/upload",
  });
  return canvasImageUrlSchema.parse(stored.url);
}

export async function storeGraphImages(graph: CanvasGraph) {
  const uploads = new Map<string, Promise<string>>();
  function store(image: string): Promise<string> {
    if (!image.startsWith("data:")) {
      return Promise.resolve(image);
    }
    let upload = uploads.get(image);
    if (!upload) {
      upload = fetch(image)
        .then((response) => response.blob())
        .then(uploadCanvasImage);
      uploads.set(image, upload);
    }
    return upload;
  }
  const assets: CanvasGraph["assets"] = {};
  const outputs: CanvasGraph["outputs"] = {};
  // Sequential uploads avoid racing initial visitor cookies and ease import load.
  for (const [id, image] of Object.entries(graph.assets)) {
    assets[id] = await store(image);
  }
  for (const [id, output] of Object.entries(graph.outputs)) {
    if (output.results) {
      const results: NonNullable<typeof output.results> = [];
      for (const item of output.results) {
        results.push(
          item.image ? { ...item, image: await store(item.image) } : item
        );
      }
      outputs[id] = { results };
      continue;
    }
    outputs[id] = output.image
      ? { ...output, image: await store(output.image) }
      : output;
  }
  return parseGraph({ ...graph, assets, outputs });
}
