import { posix as posixPath } from "node:path";

import { getSandboxAgentEnv } from "@/lib/sandbox-agent/server/env";
import { getSharedSandboxAgentSessionRegistry } from "@/lib/sandbox-agent/server/session";

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
]);

function normalizePreviewPath(pathSegments: string[]) {
  const normalizedPath = posixPath
    .normalize(`/${pathSegments.join("/")}`)
    .replace(/^(\.\.(\/|\\|$))+/, "");

  return normalizedPath === "/" ? "/index.html" : normalizedPath;
}

function getContentType(targetPath: string) {
  return (
    contentTypes.get(posixPath.extname(targetPath)) ??
    "text/plain; charset=utf-8"
  );
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      path?: string[];
      sessionId: string;
    }>;
  }
) {
  const { path = [], sessionId } = await params;
  const registry = await getSharedSandboxAgentSessionRegistry(
    getSandboxAgentEnv(),
    {
      localPreviewBaseUrl: new URL(request.url).origin,
    }
  );
  const session = registry.getSession(sessionId);
  const targetPath = normalizePreviewPath(path).slice(1);

  try {
    return new Response(await session.readFile(targetPath), {
      headers: {
        "content-type": getContentType(targetPath),
      },
    });
  } catch (error) {
    return new Response(
      error instanceof Error ? error.message : "Preview file not found.",
      {
        headers: {
          "content-type": "text/plain; charset=utf-8",
        },
        status: 404,
      }
    );
  }
}
