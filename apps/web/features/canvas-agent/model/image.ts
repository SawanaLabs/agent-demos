import { z } from "zod";

export const canvasImageTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
] as const;
export const maxCanvasImageBytes = 8 * 1024 * 1024;
export const canvasImageUrlSchema = z
  .string()
  .max(2048)
  .regex(
    /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/canvas-agent\/(uploads|results)\/[A-Za-z0-9_/-]+\.(png|jpe?g|webp|gif)$/
  );
export const canvasImageDataSchema = z
  .string()
  .max(12_000_000)
  .regex(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+=*$/);
export const canvasImageSchema = z.union([
  canvasImageUrlSchema,
  canvasImageDataSchema,
]);

export function imageExtension(image: string) {
  if (image.startsWith("data:")) {
    return image.slice("data:image/".length, image.indexOf(";"));
  }
  return image.slice(image.lastIndexOf(".") + 1);
}
