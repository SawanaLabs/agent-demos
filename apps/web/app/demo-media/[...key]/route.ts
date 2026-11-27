import { readDemoMedia } from "@/features/shared/demo-media/server/storage";
import { isDemoMediaKey } from "@/features/shared/demo-media/urls";

export const runtime = "nodejs";

const allowedContentType =
  /^(image\/(png|jpeg|webp|gif)|application\/pdf)(;|$)/;

export async function GET(
  request: Request,
  context: { params: Promise<{ key: string[] }> }
) {
  const key = (await context.params).key.join("/");
  if (!isDemoMediaKey(key)) {
    return new Response(null, { status: 404 });
  }
  const result = await readDemoMedia(key, request.signal);
  if (!result.ok || result.body === null) {
    return new Response(null, { status: result.status });
  }
  const contentType = result.headers.get("Content-Type");
  if (!(contentType && allowedContentType.test(contentType))) {
    return new Response(null, { status: 415 });
  }
  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
  });
  if (new URL(request.url).searchParams.has("download")) {
    headers.set("Content-Disposition", "attachment");
  }
  const length = result.headers.get("Content-Length");
  if (length !== null) {
    headers.set("Content-Length", length);
  }
  return new Response(result.body, { headers });
}
