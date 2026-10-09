import "server-only";
import { ZodError } from "zod";
import {
  gatewayRequestSchema,
  imageMediaTypes,
  maximumReferenceBytes,
  maximumReferences,
} from "../contract";
import { getGatewaySetup, getImageGeneratorConfig } from "./env";
import { createImageGenerator, GatewayGenerationError } from "./generate";

const responseHeaders = { "Cache-Control": "no-store" };

export async function handleGatewayImageRequest(
  request: Request
): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json(
      { error: "Send multipart form data with model and prompt." },
      { status: 400, headers: responseHeaders }
    );
  }
  const parsed = gatewayRequestSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    return Response.json(
      {
        error: parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; "),
      },
      { status: 400, headers: responseHeaders }
    );
  }
  const files = form
    .getAll("reference")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (
    files.length > maximumReferences ||
    files.reduce((total, file) => total + file.size, 0) >
      maximumReferenceBytes ||
    files.some(
      (file) =>
        !imageMediaTypes.includes(file.type as (typeof imageMediaTypes)[number])
    )
  ) {
    return Response.json(
      {
        error: "Use up to 4 PNG, JPEG or WebP references, at most 3 MB total.",
      },
      { status: 400, headers: responseHeaders }
    );
  }
  const setup = getGatewaySetup().models.find(
    (model) => model.id === parsed.data.model
  );
  if (!setup) {
    throw new Error("Missing model setup.");
  }
  if (!setup.available) {
    return Response.json(
      { error: `Configure ${setup.missing.join(", ")} on the server.` },
      { status: 503, headers: responseHeaders }
    );
  }
  try {
    const references = await Promise.all(
      files.map(async (file) => ({
        bytes: new Uint8Array(await file.arrayBuffer()),
        mediaType: file.type,
      }))
    );
    const generate = createImageGenerator(
      getImageGeneratorConfig(parsed.data.model)
    );
    const result = await generate({ ...parsed.data, references });
    return Response.json(result, { headers: responseHeaders });
  } catch (error) {
    if (error instanceof GatewayGenerationError) {
      return Response.json(
        { error: error.message, receipt: error.receipt },
        { status: 502, headers: responseHeaders }
      );
    }
    if (error instanceof ZodError) {
      return Response.json(
        { error: "Invalid generation configuration." },
        { status: 400, headers: responseHeaders }
      );
    }
    throw error;
  }
}
