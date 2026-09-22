"use client";
import { Button } from "@workspace/ui/components/button";
import { Pencil, Undo2 } from "lucide-react";
import Image from "next/image";
import { type PointerEvent, useRef, useState } from "react";
import type { Capture } from "../client/capture";

export function ScreenshotEditor({
  capture,
  paths,
  onPaths,
  disabled,
}: {
  capture: Capture;
  paths: string[];
  onPaths: (paths: string[]) => void;
  disabled: boolean;
}) {
  const [drawing, setDrawing] = useState(false);
  const [stroke, setStroke] = useState("");
  const active = useRef("");
  if (!(capture.preview && capture.base)) {
    return null;
  }
  const { width, height } = capture.base.metrics;
  function point(event: PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return `${Math.round(((event.clientX - rect.left) / rect.width) * width)} ${Math.round(((event.clientY - rect.top) / rect.height) * height)}`;
  }
  function start(event: PointerEvent<HTMLButtonElement>) {
    if (!drawing || disabled) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    active.current = `M ${point(event)}`;
    setStroke(active.current);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    if (!active.current) {
      return;
    }
    active.current += ` L ${point(event)}`;
    setStroke(active.current);
  }
  function finish() {
    if (!active.current) {
      return;
    }
    onPaths([...paths, active.current]);
    active.current = "";
    setStroke("");
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">Screenshot preview</p>
        <div className="flex gap-1">
          <Button
            aria-pressed={drawing}
            disabled={disabled}
            onClick={() => setDrawing(!drawing)}
            size="sm"
            variant={drawing ? "secondary" : "ghost"}
          >
            <Pencil size={14} />
            Draw
          </Button>
          <Button
            aria-label="Undo last stroke"
            disabled={disabled || !paths.length}
            onClick={() => onPaths(paths.slice(0, -1))}
            size="icon-sm"
            variant="ghost"
          >
            <Undo2 size={14} />
          </Button>
        </div>
      </div>
      <div
        className="relative mx-auto overflow-hidden border"
        style={{ maxWidth: Math.round((240 * width) / height) }}
      >
        <Image
          alt="Captured page with the selected element marked"
          className="h-auto w-full"
          height={height}
          src={capture.preview}
          unoptimized
          width={width}
        />
        <button
          aria-label="Draw on screenshot"
          className={`absolute inset-0 ${drawing ? "cursor-crosshair touch-none" : "pointer-events-none"}`}
          disabled={disabled || !drawing}
          onPointerCancel={() => {
            active.current = "";
            setStroke("");
          }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={finish}
          type="button"
        >
          <svg
            aria-hidden="true"
            className="pointer-events-none h-full w-full"
            viewBox={`0 0 ${width} ${height}`}
          >
            {[...paths, ...(stroke ? [stroke] : [])].map((path, index) => (
              <path
                d={path}
                fill="none"
                key={`${index}-${path}`}
                stroke={capture.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={4}
              />
            ))}
          </svg>
        </button>
      </div>
      {drawing ? (
        <p className="text-muted-foreground text-xs">
          Draw on the image. Use Undo to remove the last stroke.
        </p>
      ) : null}
    </div>
  );
}
