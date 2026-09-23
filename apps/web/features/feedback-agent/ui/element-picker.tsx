"use client";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Crosshair, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { describeTarget } from "../client/capture";
import type { Annotation } from "../upstream/types";

export function ElementPicker({
  capturing,
  error,
  onSelect,
  onCancel,
}: {
  capturing: boolean;
  error: string;
  onSelect: (annotation?: Annotation) => void;
  onCancel: () => void;
}) {
  const [target, setTarget] = useState<{ rect: DOMRect; name: string } | null>(
    null
  );
  useEffect(() => {
    function eligible(element: EventTarget | null): element is Element {
      return (
        element instanceof Element && !element.closest("[data-feedback-ui]")
      );
    }
    function highlight(event: MouseEvent | FocusEvent) {
      if (capturing || !eligible(event.target)) {
        return;
      }
      const rect = event.target.getBoundingClientRect();
      setTarget({
        rect,
        name:
          describeTarget(event.target, rect.left, rect.top).targetName ??
          "Element",
      });
    }
    function select(event: MouseEvent) {
      if (capturing || !eligible(event.target)) {
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      const rect = event.target.getBoundingClientRect();
      onSelect(
        describeTarget(
          event.target,
          event.detail === 0 ? rect.left + rect.width / 2 : event.clientX,
          event.detail === 0 ? rect.top + rect.height / 2 : event.clientY
        )
      );
    }
    function key(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    }
    function clear() {
      setTarget(null);
    }
    document.addEventListener("pointermove", highlight, true);
    document.addEventListener("focusin", highlight, true);
    document.addEventListener("click", select, true);
    document.addEventListener("keydown", key, true);
    window.addEventListener("scroll", clear, true);
    return () => {
      document.removeEventListener("pointermove", highlight, true);
      document.removeEventListener("focusin", highlight, true);
      document.removeEventListener("click", select, true);
      document.removeEventListener("keydown", key, true);
      window.removeEventListener("scroll", clear, true);
    };
  }, [capturing, onCancel, onSelect]);
  return createPortal(
    <div data-feedback-ui="picker">
      {capturing || target ? null : (
        <div className="pointer-events-none fixed inset-0 z-50 bg-overlay/50" />
      )}
      {!capturing && target ? (
        <div
          className="pointer-events-none fixed z-50 border-2 border-primary shadow-[0_0_0_100vmax] shadow-overlay/50"
          style={{
            top: target.rect.top,
            left: target.rect.left,
            width: target.rect.width,
            height: target.rect.height,
          }}
        >
          <Badge className="absolute bottom-full left-0 mb-1 max-w-64 truncate">
            {target.name}
          </Badge>
        </div>
      ) : null}
      <Card className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl shadow-lg">
        <CardContent className="flex flex-wrap items-center gap-3">
          {capturing ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Crosshair size={16} />
          )}
          <div className="min-w-0 flex-1" role="status">
            <p>
              {capturing
                ? "Capturing this view…"
                : "Select an element on the page"}
            </p>
            <p className="text-muted-foreground text-xs">
              {capturing
                ? "Your screenshot will open for review."
                : "Click a target, or use Tab and Enter. Escape cancels."}
            </p>
            {error ? (
              <p className="text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>
          <Button
            disabled={capturing}
            onClick={() => onSelect()}
            size="sm"
            variant="outline"
          >
            Whole page
          </Button>
          <Button
            aria-label="Cancel capture"
            onClick={onCancel}
            size="icon"
            variant="ghost"
          >
            <X size={16} />
          </Button>
        </CardContent>
      </Card>
    </div>,
    document.body
  );
}
