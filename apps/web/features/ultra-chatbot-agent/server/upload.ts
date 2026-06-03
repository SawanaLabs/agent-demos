import { put } from "@vercel/blob";
import { z } from "zod";

import { env as appEnv } from "@/env";
import { getVercelBlobToken } from "@/features/shared/vercel-blob/server/env";

import {
  isUltraChatbotAgentAcceptedUploadMediaType,
  ultraChatbotAgentAcceptedUploadMediaTypes,
  ultraChatbotAgentMaxUploadBytes,
} from "../attachment-config";
import {
  buildUltraChatbotAgentDailyUploadPrefix,
  buildUltraChatbotAgentUploadPath,
  formatUltraChatbotAgentUploadDateBucket,
  readUltraChatbotAgentBlobUsageForPrefix,
  validateUltraChatbotAgentBlobPathSegment,
} from "./blob-storage";

const uploadFileSchema = z.object({
  chatId: z.string().trim().min(1, {
    message: "A chat id is required.",
  }),
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= ultraChatbotAgentMaxUploadBytes, {
      message: "File size should be less than 5MB.",
    })
    .refine((file) => isUltraChatbotAgentAcceptedUploadMediaType(file.type), {
      message: "File type should be PDF, JPEG, or PNG.",
    }),
});

const ultraChatbotAgentDailyUploadFileLimit = 20;
const ultraChatbotAgentDailyUploadBytesLimit = 50 * 1024 * 1024;

export interface UltraChatbotAgentUploadEnv {
  BLOB_READ_WRITE_TOKEN?: string;
}

export interface UltraChatbotAgentUploadViewer {
  visitorId: string;
}

export interface UltraChatbotAgentUploadOptions {
  now?: Date;
}

export function getUltraChatbotAgentAcceptedUploadMediaTypes() {
  return [...ultraChatbotAgentAcceptedUploadMediaTypes];
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
  viewer: UltraChatbotAgentUploadViewer,
  env: UltraChatbotAgentUploadEnv = appEnv,
  options: UltraChatbotAgentUploadOptions = {}
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
  const maybeChatId = formData.get("chatId");

  if (!(maybeFile instanceof Blob)) {
    return Response.json({ error: "No file uploaded." }, { status: 400 });
  }

  if (typeof maybeChatId !== "string") {
    return Response.json({ error: "A chat id is required." }, { status: 400 });
  }

  const validatedUpload = uploadFileSchema.safeParse({
    chatId: maybeChatId,
    file: maybeFile,
  });

  if (!validatedUpload.success) {
    return Response.json(
      {
        error: validatedUpload.error.issues
          .map((issue) => issue.message)
          .join(" "),
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
          error instanceof Error
            ? error.message
            : "Blob storage is not configured.",
      },
      { status: 500 }
    );
  }

  const file = validatedUpload.data.file;
  const dateBucket = formatUltraChatbotAgentUploadDateBucket(
    options.now ?? new Date()
  );
  let visitorId: string;
  let chatId: string;

  try {
    visitorId = validateUltraChatbotAgentBlobPathSegment(
      viewer.visitorId,
      "Visitor id"
    );
    chatId = validateUltraChatbotAgentBlobPathSegment(
      validatedUpload.data.chatId,
      "Chat id"
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Invalid upload ownership path.",
      },
      { status: 400 }
    );
  }

  const dailyPrefix = buildUltraChatbotAgentDailyUploadPrefix({
    dateBucket,
    visitorId,
  });

  try {
    const dailyUsage = await readUltraChatbotAgentBlobUsageForPrefix({
      prefix: dailyPrefix,
      token,
    });

    if (
      dailyUsage.fileCount >= ultraChatbotAgentDailyUploadFileLimit ||
      dailyUsage.totalBytes + file.size > ultraChatbotAgentDailyUploadBytesLimit
    ) {
      return Response.json(
        { error: "Daily upload quota exceeded." },
        { status: 429 }
      );
    }
  } catch {
    return Response.json(
      { error: "Upload quota check failed." },
      { status: 500 }
    );
  }

  const filename =
    maybeFile instanceof File && maybeFile.name ? maybeFile.name : "attachment";
  const pathname = buildUltraChatbotAgentUploadPath({
    chatId,
    dateBucket,
    filename: sanitizeFilename(filename),
    uploadId: crypto.randomUUID(),
    visitorId,
  });

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
