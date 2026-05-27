const PREVIEW_ERROR_CODE_RE = /^[A-Z0-9_]+$/;

function readPreviewErrorCode(response: Response, body: string) {
  const headerCode = response.headers.get("x-vercel-error");

  if (headerCode) {
    return headerCode;
  }

  const bodyCode = body
    .split("\n")
    .map((line) => line.trim())
    .find((line) => PREVIEW_ERROR_CODE_RE.test(line));

  return bodyCode ?? null;
}

function trimBody(body: string) {
  const trimmed = body.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 280);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return Response.json(
      {
        errorCode: "MISSING_URL",
        message: "A preview URL is required.",
        ok: false,
        status: null,
        statusText: null,
      },
      { status: 400 }
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(url);
  } catch {
    return Response.json(
      {
        errorCode: "INVALID_URL",
        message: "The preview URL is not a valid absolute URL.",
        ok: false,
        status: null,
        statusText: null,
      },
      { status: 400 }
    );
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return Response.json(
      {
        errorCode: "INVALID_PROTOCOL",
        message: "The preview URL must use http or https.",
        ok: false,
        status: null,
        statusText: null,
      },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(parsedUrl, {
      cache: "no-store",
      redirect: "follow",
    });
    const body = trimBody(await response.text());

    return Response.json({
      errorCode: response.ok
        ? null
        : readPreviewErrorCode(response, body ?? ""),
      message: response.ok ? null : body,
      ok: response.ok,
      status: response.status,
      statusText: response.statusText || null,
    });
  } catch (error) {
    return Response.json({
      errorCode: "FETCH_FAILED",
      message:
        error instanceof Error ? error.message : "Failed to check preview URL.",
      ok: false,
      status: null,
      statusText: null,
    });
  }
}
