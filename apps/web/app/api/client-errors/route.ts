import { z } from "zod";

const clientErrorReportSchema = z.object({
  digest: z.string().trim().min(1).max(256).optional(),
  kind: z.enum([
    "global_error",
    "route_error",
    "unhandled_rejection",
    "window_error",
  ]),
  message: z.string().trim().min(1).max(1000),
  path: z.string().trim().min(1).max(2048).optional(),
  source: z.string().trim().min(1).max(128).optional(),
  stack: z.string().trim().min(1).max(4000).optional(),
});

export async function POST(request: Request) {
  const parsedBody = clientErrorReportSchema.safeParse(await readJson(request));

  if (!parsedBody.success) {
    return Response.json(
      {
        error: "Invalid client error report.",
        ok: false,
      },
      { status: 400 }
    );
  }

  const userAgent = request.headers.get("user-agent")?.slice(0, 512);

  console.error(
    JSON.stringify({
      ...parsedBody.data,
      event: "client_exception",
      reportedAt: new Date().toISOString(),
      userAgent,
    })
  );

  return new Response(null, { status: 204 });
}

async function readJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
