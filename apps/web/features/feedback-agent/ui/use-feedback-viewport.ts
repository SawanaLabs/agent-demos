"use client";

import { type CSSProperties, useEffect, useState } from "react";

/** Keep the narrow-screen sheet inside the viewport above the soft keyboard. */
export function useFeedbackViewport(active: boolean) {
  const [style, setStyle] = useState<CSSProperties>({});
  useEffect(() => {
    if (!active) {
      return;
    }
    const viewport = window.visualViewport;
    function update() {
      const height = viewport?.height ?? window.innerHeight;
      const offset = viewport?.offsetTop ?? 0;
      setStyle({
        "--feedback-keyboard-inset": `${Math.max(0, window.innerHeight - height - offset)}px`,
        "--feedback-sheet-height": `${Math.min(window.innerHeight * 0.85, height)}px`,
      } as CSSProperties);
    }
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [active]);
  return style;
}
