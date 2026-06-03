import { del, list } from "@vercel/blob";

export const ultraChatbotAgentUploadPathRoot = "ultra-chatbot-agent";
export const ultraChatbotAgentUploadListLimit = 1000;

const millisecondsPerDay = 24 * 60 * 60 * 1000;
const ultraChatbotAgentBlobDeleteBatchSize = 100;
const ownedUploadPathSegmentRe = /^[a-zA-Z0-9_-]+$/;

export interface UltraChatbotAgentBlobStorageEnv {
  BLOB_READ_WRITE_TOKEN?: string;
}

export function validateUltraChatbotAgentBlobPathSegment(
  value: string,
  label: string
) {
  const trimmed = value.trim();

  if (!ownedUploadPathSegmentRe.test(trimmed)) {
    throw new Error(
      `${label} must contain only letters, numbers, hyphens, or underscores.`
    );
  }

  return trimmed;
}

export function formatUltraChatbotAgentUploadDateBucket(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function buildUltraChatbotAgentDailyUploadPrefix(input: {
  dateBucket: string;
  visitorId: string;
}) {
  return `${ultraChatbotAgentUploadPathRoot}/${input.visitorId}/${input.dateBucket}/`;
}

export function buildUltraChatbotAgentVisitorUploadPrefix(visitorId: string) {
  return `${ultraChatbotAgentUploadPathRoot}/${visitorId}/`;
}

export function buildUltraChatbotAgentUploadPath(input: {
  chatId: string;
  dateBucket: string;
  filename: string;
  uploadId: string;
  visitorId: string;
}) {
  return `${buildUltraChatbotAgentDailyUploadPrefix({
    dateBucket: input.dateBucket,
    visitorId: input.visitorId,
  })}${input.chatId}/${input.uploadId}-${input.filename}`;
}

async function listUltraChatbotAgentBlobs(input: {
  prefix: string;
  token: string;
}) {
  let cursor: string | undefined;
  const blobs: Awaited<ReturnType<typeof list>>["blobs"] = [];

  do {
    const listOptions: {
      cursor?: string;
      limit: number;
      prefix: string;
      token: string;
    } = {
      limit: ultraChatbotAgentUploadListLimit,
      prefix: input.prefix,
      token: input.token,
    };

    if (cursor) {
      listOptions.cursor = cursor;
    }

    const result = await list(listOptions);
    blobs.push(...result.blobs);
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return blobs;
}

export async function readUltraChatbotAgentBlobUsageForPrefix(input: {
  prefix: string;
  token: string;
}) {
  const blobs = await listUltraChatbotAgentBlobs(input);

  return {
    fileCount: blobs.length,
    totalBytes: blobs.reduce((sum, blob) => sum + blob.size, 0),
  };
}

async function deleteUltraChatbotAgentBlobPathnames(input: {
  pathnames: string[];
  token: string;
}) {
  for (
    let index = 0;
    index < input.pathnames.length;
    index += ultraChatbotAgentBlobDeleteBatchSize
  ) {
    const batch = input.pathnames.slice(
      index,
      index + ultraChatbotAgentBlobDeleteBatchSize
    );

    if (batch.length > 0) {
      await del(batch, { token: input.token });
    }
  }
}

function isUltraChatbotAgentChatBlob(input: {
  chatId: string;
  pathname: string;
  visitorId: string;
}) {
  const [root, visitorId, _dateBucket, chatId] = input.pathname.split("/");
  return (
    root === ultraChatbotAgentUploadPathRoot &&
    visitorId === input.visitorId &&
    chatId === input.chatId
  );
}

export async function deleteUltraChatbotAgentBlobsForChat(input: {
  chatId: string;
  token: string;
  visitorId: string;
}) {
  const visitorId = validateUltraChatbotAgentBlobPathSegment(
    input.visitorId,
    "Visitor id"
  );
  const chatId = validateUltraChatbotAgentBlobPathSegment(
    input.chatId,
    "Chat id"
  );
  const blobs = await listUltraChatbotAgentBlobs({
    prefix: buildUltraChatbotAgentVisitorUploadPrefix(visitorId),
    token: input.token,
  });
  const pathnames = blobs
    .filter((blob) =>
      isUltraChatbotAgentChatBlob({
        chatId,
        pathname: blob.pathname,
        visitorId,
      })
    )
    .map((blob) => blob.pathname);

  await deleteUltraChatbotAgentBlobPathnames({
    pathnames,
    token: input.token,
  });

  return {
    deletedCount: pathnames.length,
  };
}

export async function deleteUltraChatbotAgentBlobsForVisitor(input: {
  token: string;
  visitorId: string;
}) {
  const visitorId = validateUltraChatbotAgentBlobPathSegment(
    input.visitorId,
    "Visitor id"
  );
  const blobs = await listUltraChatbotAgentBlobs({
    prefix: buildUltraChatbotAgentVisitorUploadPrefix(visitorId),
    token: input.token,
  });
  const pathnames = blobs.map((blob) => blob.pathname);

  await deleteUltraChatbotAgentBlobPathnames({
    pathnames,
    token: input.token,
  });

  return {
    deletedCount: pathnames.length,
  };
}

export async function cleanupExpiredUltraChatbotAgentBlobs(input: {
  now?: Date;
  retentionDays: number;
  token: string;
}) {
  const now = input.now ?? new Date();
  const expiresBefore = new Date(
    now.getTime() - input.retentionDays * millisecondsPerDay
  );
  const blobs = await listUltraChatbotAgentBlobs({
    prefix: `${ultraChatbotAgentUploadPathRoot}/`,
    token: input.token,
  });
  const pathnames = blobs
    .filter((blob) => blob.uploadedAt < expiresBefore)
    .map((blob) => blob.pathname);

  await deleteUltraChatbotAgentBlobPathnames({
    pathnames,
    token: input.token,
  });

  return {
    deletedCount: pathnames.length,
    expiresBefore: expiresBefore.toISOString(),
    retentionDays: input.retentionDays,
  };
}
