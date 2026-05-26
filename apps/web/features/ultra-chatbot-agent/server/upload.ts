import { put } from "@vercel/blob";
import { z } from "zod";

import { env as appEnv } from "@/env";
import { getVercelBlobToken } from "@/features/shared/vercel-blob/server/env";

const maxUploadBytes = 5 * 1024 * 1024;
const acceptedUploadMediaTypes = ["image/jpeg", "image/png"] as const;

const uploadFileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= maxUploadBytes, {
      message: "File size should be less than 5MB.",
    })
    .refine((file) => acceptedUploadMediaTypes.includes(file.type as never), {
      message: "File type should be JPEG or PNG.",
    }),
});

export interface UltraChatbotAgentUploadEnv {
  BLOB_READ_WRITE_TOKEN?: string;
}

export function getUltraChatbotAgentAcceptedUploadMediaTypes() {
  return [...acceptedUploadMediaTypes];
}

function sanitizeFilename(filename: string) {
  const trimmed = filename.trim();

  if (trimmed.length === 0) {
    return "attachment";
  }

  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function handleUltraChatbotAgentFileUploadRequest(
  request: Request,
  env: UltraChatbotAgentUploadEnv = appEnv
) {
  if (request.body === null) {
    return Response.json({ error: "Request body is empty." }, { status: 400 });
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Failed to process the upload request." },
      { status: 500 }
    );
  }

  const maybeFile = formData.get("file");

  if (!(maybeFile instanceof Blob)) {
    return Response.json({ error: "No file uploaded." }, { status: 400 });
  }

  const validatedUpload = uploadFileSchema.safeParse({
    file: maybeFile,
  });

  if (!validatedUpload.success) {
    return Response.json(
      {
        error: validatedUpload.error.issues.map((issue) => issue.message).join(" "),
      },
      { status: 400 }
    );
  }

  let token: string;

  try {
    token = getVercelBlobToken(env);
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Blob storage is not configured.",
      },
      { status: 500 }
    );
  }

  const file = validatedUpload.data.file;
  const filename =
    maybeFile instanceof File && maybeFile.name ? maybeFile.name : "attachment";
  const pathname = `ultra-chatbot-agent/${crypto.randomUUID()}-${sanitizeFilename(filename)}`;

  try {
    const uploadedBlob = await put(pathname, file, {
      access: "public",
      token,
    });

    return Response.json({
      contentType: uploadedBlob.contentType,
      pathname: uploadedBlob.pathname,
      size: file.size,
      url: uploadedBlob.url,
    });
  } catch {
    return Response.json({ error: "Upload failed." }, { status: 500 });
  }
}
