import { posix as posixPath } from "node:path";

function normalizeEntryPath(entryPath: string) {
  const normalizedPath = posixPath
    .normalize(entryPath.startsWith("/") ? entryPath : `/${entryPath}`)
    .replace(/^(\.\.(\/|\\|$))+/, "");

  return normalizedPath === "/" ? "/index.html" : normalizedPath;
}

function buildPathPreviewUrl({
  directory,
  entryPath,
  request,
  sessionId,
}: {
  directory: string;
  entryPath: string;
  request: Request;
  sessionId: string;
}) {
  const normalizedDirectory =
    directory === "." ? "" : directory.replace(/^\/+/, "");
  const previewPath = posixPath.join(
    normalizedDirectory,
    normalizeEntryPath(entryPath).slice(1)
  );
  const url = new URL(request.url);
  url.pathname = [
    "/api/demos/sandbox-agent/local-preview",
    encodeURIComponent(sessionId),
    ...previewPath.split("/").filter(Boolean).map(encodeURIComponent),
  ].join("/");
  url.search = "";

  return url;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const directory = searchParams.get("directory") ?? ".";
  const entryPath = searchParams.get("path") ?? "/index.html";

  if (!sessionId) {
    return new Response("Missing sessionId.", { status: 400 });
  }

  return Response.redirect(
    buildPathPreviewUrl({
      directory,
      entryPath,
      request,
      sessionId,
    }),
    307
  );
}
