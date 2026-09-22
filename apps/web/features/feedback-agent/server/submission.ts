import sharp from "sharp";
import { z } from "zod";
import type { FeedbackEvidence } from "../types";
import {
  filterSensitiveText,
  filterSensitiveValue,
  sanitizeUrl,
} from "../upstream/sanitize";

export class FeedbackError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function readLimitedBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) {
    throw new FeedbackError("A request body is required.");
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    size += chunk.value.byteLength;
    if (size > 3_000_000) {
      await reader.cancel();
      throw new FeedbackError("Capture exceeds the 3 MB upload limit.", 413);
    }
    chunks.push(chunk.value);
  }
  return new Response(Buffer.concat(chunks), {
    headers: {
      "content-type": request.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function parseSubmission(
  form: FormData,
  policy: string | null
): Promise<FeedbackEvidence> {
  const description = z
    .string()
    .trim()
    .min(1)
    .max(8000)
    .parse(form.get("feedback[description]"));
  const context: Record<string, unknown> = {};
  for (const field of [
    "page_url",
    "browser",
    "os",
    "screen_width",
    "screen_height",
  ]) {
    const value = form.get(`feedback[${field}]`);
    if (typeof value === "string") {
      context[field] =
        field === "page_url"
          ? sanitizeUrl(value)
          : filterSensitiveText(value.slice(0, 2000));
    }
  }
  for (const field of [
    "annotations",
    "target_element",
    "console_errors",
    "breadcrumbs",
  ]) {
    const value = form.get(`feedback[${field}]`);
    if (typeof value === "string") {
      if (value.length > 100_000) {
        throw new FeedbackError("Captured context is too large.", 413);
      }
      context[field] = filterSensitiveValue(JSON.parse(value));
    }
  }
  const evidence: FeedbackEvidence = {
    context,
    description: filterSensitiveText(description),
  };
  if (policy !== "sensitive-data-v1") {
    return evidence;
  }
  await attachScreenshot(form, evidence);
  await attachReplay(form, evidence);
  return evidence;
}

export async function attachScreenshot(
  form: FormData,
  evidence: FeedbackEvidence
) {
  const screenshot = form.get("feedback[screenshot]");
  if (screenshot instanceof File && screenshot.size > 0) {
    if (!["image/png", "image/jpeg"].includes(screenshot.type)) {
      throw new FeedbackError("Screenshot must be PNG or JPEG.");
    }
    const bytes = await sharp(Buffer.from(await screenshot.arrayBuffer()), {
      limitInputPixels: 20_000_000,
    })
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();
    if (bytes.length > 1_500_000) {
      throw new FeedbackError("Screenshot is too large.", 413);
    }
    evidence.screenshot = `data:image/png;base64,${bytes.toString("base64")}`;
  }
}

async function attachReplay(form: FormData, evidence: FeedbackEvidence) {
  const recording = form.get("feedback[recording]");
  if (recording instanceof File && recording.size <= 1_000_000) {
    try {
      evidence.recording = JSON.stringify(
        filterSensitiveValue(JSON.parse(await recording.text()))
      );
    } catch {
      /* Upstream protocol requires discarding malformed replay without losing the report. */
    }
  }
  return evidence;
}
