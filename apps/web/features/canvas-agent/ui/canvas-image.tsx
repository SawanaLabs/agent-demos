"use client";

import { Button } from "@workspace/ui/components/button";
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function CanvasImage({ src, label }: { src: string; label: string }) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  let imageSrc = src;
  if (attempt && src.startsWith("https:")) {
    const url = new URL(src);
    if (url.hostname.endsWith(".public.blob.vercel-storage.com")) {
      url.searchParams.set("previewRetry", String(attempt));
      imageSrc = url.toString();
    }
  }
  return (
    <div className="space-y-2">
      {status === "error" ? (
        <div
          className="nodrag space-y-2 rounded-sm border border-destructive/40 p-3"
          role="alert"
        >
          <p className="flex items-center gap-2 text-sm">
            <AlertCircleIcon className="size-4" />
            图片预览加载失败
          </p>
          <p className="text-muted-foreground text-xs">
            可以重新加载预览，或下载原图查看。重新加载不会重新生成或消耗积分。
          </p>
          <Button
            className="nodrag"
            onClick={() => {
              setAttempt(Date.now());
              setStatus("loading");
            }}
            size="sm"
            variant="outline"
          >
            <RefreshCwIcon className="size-3.5" />
            重新加载图片
          </Button>
        </div>
      ) : (
        <Image
          alt={label}
          className="nodrag max-h-80 w-full rounded-sm object-contain"
          height={280}
          key={attempt}
          onError={() => setStatus("error")}
          onLoad={() => setStatus("ready")}
          src={imageSrc}
          unoptimized
          width={296}
        />
      )}
      {status === "loading" ? (
        <p aria-live="polite" className="text-muted-foreground text-xs">
          正在加载图片…
        </p>
      ) : null}
    </div>
  );
}
