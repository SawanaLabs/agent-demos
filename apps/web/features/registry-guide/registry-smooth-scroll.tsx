"use client";

import { useEffect } from "react";

export function RegistrySmoothScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!reduceMotion.matches) {
      root.style.scrollBehavior = "smooth";
    }

    return () => {
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, []);

  return null;
}
