export interface WidgetBrandColors {
  active: string;
  hover: string;
  onPrimary: string;
  primary: string;
}

export interface TargetRect {
  bottom: number;
  height: number;
  left: number;
  top: number;
  width: number;
}

export interface Annotation {
  /**
   * Page scroll plus enclosing-container scroll at the instant the annotation
   * was made. Adding it to x/y (and to targetRect and drawPath, which share
   * their frame) gives the position in the screenshot's clone space, where
   * html-to-image renders every element unscrolled. Recording it here is what
   * keeps an annotation attached to what the reporter marked when they scroll
   * on their way to the submit button.
   *
   * Absent on annotations from clients that predate this field, which the
   * screenshot path still handles by measuring the scroll itself at capture
   * time.
   */
  captureOffsetX?: number;
  captureOffsetY?: number;
  drawPath?: string;
  targetName?: string;
  targetRect?: TargetRect;
  targetSelector?: string;
  targetText?: string;
  type: "pin" | "draw";
  /**
   * Viewport coordinates as of the moment the annotation was made — which is
   * not necessarily where the target sits now, because the page can scroll
   * before the reporter submits. Pair them with captureOffsetX/Y to get back to
   * a position that scrolling cannot move.
   */
  x: number;
  y: number;
}
