"use client";

import { Button, buttonVariants } from "@workspace/ui/components/button";
import { CheckIcon, CopyIcon, DownloadIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { CanvasOutput } from "../model/graph";
import { imageExtension } from "../model/image";
import { CanvasImage } from "./canvas-image";

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
        <CanvasImage key={content.image} label={label} src={content.image} />
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
        <>
          <CopyTextButton key={content.text} text={content.text} />
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
        </>
      ) : null}
    </>
  );
}

function CopyTextButton({ text }: { text: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  useEffect(() => {
    if (status === "idle") {
      return;
    }
    const timer = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(timer);
  }, [status]);

  return (
    <Button
      aria-live="polite"
      className="nodrag"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setStatus("copied");
        } catch {
          setStatus("error");
        }
      }}
      size="sm"
      variant="outline"
    >
      {status === "copied" ? (
        <CheckIcon aria-hidden="true" />
      ) : (
        <CopyIcon aria-hidden="true" />
      )}
      {{ idle: "复制", copied: "已复制", error: "复制失败，请重试" }[status]}
    </Button>
  );
}
