"use client";

import { buttonVariants } from "@workspace/ui/components/button";
import { DownloadIcon } from "lucide-react";
import Image from "next/image";
import type { CanvasOutput } from "../model/graph";
import { imageExtension } from "../model/image";

export function CanvasContent({
  content,
  label,
}: {
  content: CanvasOutput;
  label: string;
}) {
  return (
    <div className="space-y-3">
      {content.image ? (
        <div className="space-y-2">
          <Image
            alt={label}
            className="nodrag max-h-80 w-full rounded-sm object-contain"
            height={280}
            src={content.image}
            unoptimized
            width={296}
          />
        </div>
      ) : null}
      {content.text ? (
        <div className="space-y-2">
          <p className="nodrag nowheel max-h-80 select-text overflow-y-auto whitespace-pre-wrap break-words text-sm leading-relaxed">
            {content.text}
          </p>
        </div>
      ) : null}
      {content.image || content.text ? null : (
        <p className="text-muted-foreground text-xs">等待上游内容</p>
      )}
    </div>
  );
}

export function CanvasDownloads({
  content,
  label,
}: {
  content: CanvasOutput;
  label: string;
}) {
  const extension = content.image ? imageExtension(content.image) : "png";
  return (
    <>
      {content.image ? (
        <a
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "nodrag",
          })}
          download={`${label}.${extension}`}
          href={
            content.image.startsWith("https:")
              ? `${content.image}?download=1`
              : content.image
          }
          title={label}
        >
          <DownloadIcon aria-hidden="true" className="size-3.5" />
          {extension === "gif" ? "下载 GIF" : "下载图片"}
        </a>
      ) : null}
      {content.text ? (
        <a
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "nodrag",
          })}
          download={`${label}.txt`}
          href={`data:text/plain;charset=utf-8,${encodeURIComponent(content.text)}`}
          title={label}
        >
          <DownloadIcon aria-hidden="true" className="size-3.5" />
          下载文本
        </a>
      ) : null}
    </>
  );
}
