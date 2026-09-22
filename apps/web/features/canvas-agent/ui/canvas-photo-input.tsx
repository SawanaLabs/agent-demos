"use client";
import { Button } from "@workspace/ui/components/button";
import type { FileUIPart } from "ai";
import { ImagePlusIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { uploadCanvasImage } from "./image-upload";

export function useChatPhotos(setError: (error: string | null) => void) {
  const [files, setFiles] = useState<FileUIPart[]>([]);
  const [uploading, setUploading] = useState(false);
  const locked = useRef(false);
  async function add(file: File) {
    if (locked.current) {
      return;
    }
    locked.current = true;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadCanvasImage(file);
      setFiles((current) => [
        ...current,
        { type: "file", url, mediaType: file.type, filename: file.name },
      ]);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "图片上传失败，请重试。"
      );
    } finally {
      locked.current = false;
      setUploading(false);
    }
  }
  return {
    files,
    uploading,
    add,
    clear: () => setFiles([]),
    remove: (url: string) =>
      setFiles((current) => current.filter((file) => file.url !== url)),
  };
}

type Photos = ReturnType<typeof useChatPhotos>;
export function CanvasPhotoInput({
  photos,
  disabled,
}: {
  photos: Photos;
  disabled: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        accept="image/png,image/jpeg,image/webp,image/gif"
        aria-label="上传照片到对话"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            void photos.add(file);
          }
        }}
        ref={input}
        tabIndex={-1}
        type="file"
      />
      <Button
        aria-label="添加照片"
        disabled={disabled || photos.files.length >= 4}
        onClick={() => input.current?.click()}
        size="icon-sm"
        title="添加照片（最大 8 MB）"
        type="button"
        variant="ghost"
      >
        <ImagePlusIcon className="size-4" />
      </Button>
      {photos.uploading ? (
        <span className="text-xs" role="status">
          上传中…
        </span>
      ) : null}
    </>
  );
}

export function CanvasPhotoPreviews({
  photos,
  disabled,
}: {
  photos: Photos;
  disabled: boolean;
}) {
  if (photos.files.length === 0) {
    return null;
  }
  return (
    <fieldset
      aria-label="待发送的照片"
      className="flex gap-2 overflow-x-auto pb-2"
    >
      {photos.files.map((file) => (
        <figure className="relative w-16 shrink-0" key={file.url}>
          <Image
            alt={file.filename || "待发送照片"}
            className="h-12 w-16 rounded-md border object-cover"
            height={48}
            src={file.url}
            unoptimized
            width={64}
          />
          <Button
            aria-label={`移除附件 ${file.filename || "照片"}`}
            className="absolute top-0 right-0 size-5"
            disabled={disabled}
            onClick={() => photos.remove(file.url)}
            size="icon-sm"
            type="button"
            variant="secondary"
          >
            <XIcon className="size-3" />
          </Button>
          <figcaption className="truncate text-muted-foreground text-xs">
            {file.filename}
          </figcaption>
        </figure>
      ))}
    </fieldset>
  );
}
