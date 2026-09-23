import { collectPageContext } from "../upstream/context/collector";
import { getCssSelector, getElementName } from "../upstream/context/dom-utils";
import {
  isPrivacyProtected,
  structuralElementName,
} from "../upstream/privacy/dom";
import { filterSensitiveText } from "../upstream/sanitize";
import {
  type BaseScreenshot,
  bakeAnnotatedScreenshot,
  captureBaseScreenshot,
} from "../upstream/screenshot/capture";
import { captureAnchorOffset } from "../upstream/screenshot/geometry";
import type { Annotation } from "../upstream/types";

export interface DrawStroke {
  color: string;
  path: string;
}

export interface Capture {
  annotation?: Annotation;
  base: BaseScreenshot | null;
  color: string;
  context: ReturnType<typeof collectPageContext>;
  preview: string | null;
}

export function describeTarget(
  element: Element,
  x: number,
  y: number
): Annotation {
  const protectedElement = isPrivacyProtected(element);
  const rect = element.getBoundingClientRect();
  const offset = captureAnchorOffset(element);
  return {
    type: "pin",
    x,
    y,
    targetSelector: protectedElement
      ? element.tagName.toLowerCase()
      : getCssSelector(element),
    targetName: protectedElement
      ? structuralElementName(element)
      : filterSensitiveText(getElementName(element)),
    targetRect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
    },
    captureOffsetX: offset.x,
    captureOffsetY: offset.y,
  };
}

export function screenshotAnnotations(
  capture: Capture,
  paths: DrawStroke[]
): Annotation[] {
  return [
    ...(capture.annotation ? [capture.annotation] : []),
    ...paths.map(({ path, color }) => ({
      type: "draw" as const,
      x: 0,
      y: 0,
      drawPath: path,
      color,
      captureOffsetX: capture.base?.pageScroll.x ?? 0,
      captureOffsetY: capture.base?.pageScroll.y ?? 0,
    })),
  ];
}

export async function renderScreenshot(capture: Capture, paths: DrawStroke[]) {
  if (!capture.base) {
    throw new Error(
      "Screenshot could not be captured. Retake it or turn off Include screenshot."
    );
  }
  const blob = await bakeAnnotatedScreenshot(
    capture.base,
    screenshotAnnotations(capture, paths),
    {
      primary: capture.color,
      hover: capture.color,
      active: capture.color,
      onPrimary: "#ffffff",
    }
  );
  if (!blob) {
    throw new Error(
      "Screenshot could not be rendered. Retake it or turn off Include screenshot."
    );
  }
  return blob;
}

function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error("Screenshot preview could not be loaded."));
    reader.readAsDataURL(blob);
  });
}

export async function capturePage(annotation?: Annotation): Promise<Capture> {
  // Let React remove selection chrome before cloning the page.
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
  const color =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--primary")
      .trim() || "#171717";
  const capture: Capture = {
    context: collectPageContext(),
    annotation,
    color,
    base: await captureBaseScreenshot(),
    preview: null,
  };
  if (capture.base) {
    capture.preview = await dataUrl(await renderScreenshot(capture, []));
  }
  return capture;
}
