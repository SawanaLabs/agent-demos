import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { ListCommandOptions, PutCommandOptions } from "@vercel/blob";
import { del, list, put } from "@vercel/blob";
import {
  getVercelBlobToken,
  type VercelBlobEnv,
} from "../../vercel-blob/server/env";
import { demoMediaUrl, legacyDemoMediaOrigin } from "../urls";
import { demoMediaEnv } from "./env";

const bucket = "agent-demos-production-r2-media";
const cache: { value?: S3Client } = {};
const keyInput = (key: string) => ({ Bucket: bucket, Key: key });
export const demoMediaMode = () => demoMediaEnv().PRIVATE_MEDIA_BACKEND;
export const demoMediaLegacyToken = (env?: VercelBlobEnv) =>
  demoMediaMode() === "r2" ? "" : getVercelBlobToken(env);

function r2() {
  const env = demoMediaEnv();
  const {
    R2_ACCOUNT_ID,
    R2_PRIVATE_MEDIA_ACCESS_KEY_ID,
    R2_PRIVATE_MEDIA_SECRET_ACCESS_KEY,
  } = env;
  if (
    !(
      R2_ACCOUNT_ID &&
      R2_PRIVATE_MEDIA_ACCESS_KEY_ID &&
      R2_PRIVATE_MEDIA_SECRET_ACCESS_KEY
    )
  ) {
    throw new Error("Production R2 media credentials are missing.");
  }
  cache.value ??= new S3Client({
    credentials: {
      accessKeyId: R2_PRIVATE_MEDIA_ACCESS_KEY_ID,
      secretAccessKey: R2_PRIVATE_MEDIA_SECRET_ACCESS_KEY,
    },
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    region: "auto",
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return cache.value;
}

export async function putDemoMedia(
  pathname: string,
  body: Blob | Buffer,
  options: PutCommandOptions
) {
  if (demoMediaMode() === "blob") {
    return await put(pathname, body, options);
  }
  const contentType =
    options.contentType ??
    (body instanceof Blob ? body.type : "application/octet-stream");
  await r2().send(
    new PutObjectCommand({
      ...keyInput(pathname),
      Body:
        body instanceof Blob ? new Uint8Array(await body.arrayBuffer()) : body,
      CacheControl: "private, no-store",
      ContentType: contentType,
      IfNoneMatch: "*",
    }),
    { abortSignal: options.abortSignal }
  );
  return { contentType, pathname, url: demoMediaUrl(pathname) };
}

export async function listDemoMedia(options: ListCommandOptions) {
  if (demoMediaMode() === "blob") {
    return await list(options);
  }
  const page = await r2().send(
    new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: options.cursor,
      MaxKeys: options.limit,
      Prefix: options.prefix,
    })
  );
  const blobs = (page.Contents ?? []).map(({ Key, LastModified, Size }) => {
    if (!Key || LastModified === undefined || Size === undefined) {
      throw new Error("Incomplete media object listing");
    }
    return { pathname: Key, size: Size, uploadedAt: LastModified };
  });
  if (options.prefix === "ultra-chatbot-agent/") {
    for (let index = 0; index < blobs.length; index += 16) {
      await Promise.all(
        blobs.slice(index, index + 16).map(async (blob) => {
          const timestamp = await originalUploadTime(blob.pathname);
          if (timestamp) {
            blob.uploadedAt = timestamp;
          }
        })
      );
    }
  }
  return {
    blobs,
    cursor: page.NextContinuationToken,
    hasMore: page.IsTruncated === true,
  };
}

async function originalUploadTime(pathname: string) {
  try {
    const result = await r2().send(new HeadObjectCommand(keyInput(pathname)));
    const timestamp = result.Metadata?.["blob-uploaded-at"];
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    if (
      error instanceof S3ServiceException &&
      error.$metadata.httpStatusCode === 404
    ) {
      return null;
    }
    throw error;
  }
}

export async function deleteDemoMedia(
  pathnames: string[],
  options: { token: string }
) {
  const mode = demoMediaMode();
  if (mode !== "blob") {
    const result = await r2().send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: pathnames.map((Key) => ({ Key })), Quiet: true },
      })
    );
    if (result.Errors?.length) {
      throw new Error("Unable to remove one or more R2 media objects.");
    }
  }
  if (mode !== "r2") {
    await del(pathnames, options);
  }
}

export async function signDemoImageUpload(
  pathname: string,
  input: { contentLength: number; contentType: string }
) {
  const uploadUrl = await getSignedUrl(
    r2(),
    new PutObjectCommand({
      ...keyInput(pathname),
      ContentLength: input.contentLength,
      ContentType: input.contentType,
      IfNoneMatch: "*",
    }),
    {
      expiresIn: 300,
      signableHeaders: new Set([
        "content-length",
        "content-type",
        "if-none-match",
      ]),
    }
  );
  return {
    headers: { "Content-Type": input.contentType, "If-None-Match": "*" },
    uploadUrl,
    url: demoMediaUrl(pathname),
  };
}

const unsignedLegacyMedia = async (key: string, signal?: AbortSignal) =>
  await fetch(`${legacyDemoMediaOrigin}/${key}`, { redirect: "error", signal });

export async function readDemoMedia(key: string, signal?: AbortSignal) {
  const mode = demoMediaMode();
  if (mode === "blob") {
    return await unsignedLegacyMedia(key, signal);
  }
  try {
    const result = await r2().send(new GetObjectCommand(keyInput(key)), {
      abortSignal: signal,
    });
    if (
      !(result.Body && result.ContentType) ||
      result.ContentLength === undefined
    ) {
      throw new Error("Incomplete media object.");
    }
    return new Response(result.Body.transformToWebStream(), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Length": String(result.ContentLength),
        "Content-Type": result.ContentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (
      !(error instanceof S3ServiceException) ||
      error.$metadata.httpStatusCode !== 404
    ) {
      throw error;
    }
    if (mode === "r2-migrating") {
      return await unsignedLegacyMedia(key, signal);
    }
    return new Response(null, { status: 404 });
  }
}
